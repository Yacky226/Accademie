import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { SubmissionStatus } from '../../core/enums';
import { JudgeExecutionService } from './execution/judge-execution.service';
import {
  type JudgeExecutionResult,
  type JudgeSubmissionEvaluation,
} from './execution/judge-execution.types';
import { JudgeRepository } from './repositories/judge.repository';
import { JudgeRunEntity } from './entities/judge-run.entity';
import { SubmissionEntity } from '../submissions/entities/submission.entity';

type JudgeQueueJob =
  | {
      kind: 'run';
      runId: string;
    }
  | {
      kind: 'submission';
      submissionId: string;
    };

@Injectable()
export class JudgeQueueService implements OnModuleInit, OnModuleDestroy {
  private static readonly queueName = 'judge-execution';
  private readonly logger = new Logger(JudgeQueueService.name);
  private readonly queuedKeys = new Set<string>();
  private readonly queue: JudgeQueueJob[] = [];
  private activeWorkers = 0;
  private queueRedisConnection?: IORedis;
  private workerRedisConnection?: IORedis;
  private bullQueue?: Queue<JudgeQueueJob>;
  private bullWorker?: Worker<JudgeQueueJob>;
  private bullMqEnabled = false;

  constructor(
    private readonly judgeRepository: JudgeRepository,
    private readonly judgeExecutionService: JudgeExecutionService,
  ) {}

  onModuleInit(): void {
    if (!this.shouldUseBullMq()) {
      this.logger.log(
        'Judge queue is running in memory mode. Configure Redis and set JUDGE_QUEUE_DRIVER=bullmq to persist jobs.',
      );
      return;
    }

    try {
      this.queueRedisConnection = this.createRedisConnection();
      this.workerRedisConnection = this.queueRedisConnection.duplicate();
      this.bullQueue = new Queue<JudgeQueueJob>(JudgeQueueService.queueName, {
        connection: this.queueRedisConnection,
        defaultJobOptions: {
          attempts: this.getRetryAttempts(),
          backoff: {
            delay: 3000,
            type: 'exponential',
          },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });
      this.bullWorker = new Worker<JudgeQueueJob>(
        JudgeQueueService.queueName,
        async (job) => this.processBullMqJob(job),
        {
          concurrency: this.getConcurrency(),
          connection: this.workerRedisConnection,
        },
      );
      this.bullWorker.on('failed', (job, error) => {
        this.logger.error(
          `BullMQ judge job ${job?.id ?? 'unknown'} failed: ${error.message}`,
        );
      });
      this.bullMqEnabled = true;
      this.logger.log(
        'Judge queue is running with BullMQ and Redis persistence.',
      );
    } catch (error) {
      this.bullMqEnabled = false;
      this.logger.warn(
        `Unable to start BullMQ judge queue, falling back to memory mode: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([
      this.bullWorker?.close(),
      this.bullQueue?.close(),
      this.workerRedisConnection?.quit(),
      this.queueRedisConnection?.quit(),
    ]);
  }

  enqueueRun(runId: string): void {
    void this.enqueue({ kind: 'run', runId }).catch((error) => {
      this.logger.error(
        `Unable to enqueue run ${runId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    });
  }

  enqueueSubmission(submissionId: string): void {
    void this.enqueue({ kind: 'submission', submissionId }).catch((error) => {
      this.logger.error(
        `Unable to enqueue submission ${submissionId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    });
  }

  private async enqueue(job: JudgeQueueJob): Promise<void> {
    if (this.bullMqEnabled && this.bullQueue) {
      try {
        await this.bullQueue.add(job.kind, job, {
          jobId: this.toJobKey(job),
        });
        return;
      } catch (error) {
        this.logger.warn(
          `BullMQ enqueue failed for ${this.toJobKey(job)}, falling back to memory mode: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
        this.bullMqEnabled = false;
      }
    }

    this.enqueueInMemory(job);
  }

  private enqueueInMemory(job: JudgeQueueJob): void {
    const jobKey = this.toJobKey(job);
    if (this.queuedKeys.has(jobKey)) {
      return;
    }

    this.queue.push(job);
    this.queuedKeys.add(jobKey);
    queueMicrotask(() => void this.drainQueue());
  }

  private drainQueue(): void {
    while (
      this.activeWorkers < this.getConcurrency() &&
      this.queue.length > 0
    ) {
      const job = this.queue.shift();
      if (!job) {
        return;
      }

      this.activeWorkers += 1;
      void this.processJob(job).finally(() => {
        this.activeWorkers -= 1;
        this.queuedKeys.delete(this.toJobKey(job));
        queueMicrotask(() => void this.drainQueue());
      });
    }
  }

  private async processBullMqJob(job: Job<JudgeQueueJob>): Promise<void> {
    await this.processJob(job.data);
  }

  private async processJob(job: JudgeQueueJob): Promise<void> {
    try {
      if (job.kind === 'run') {
        await this.processRun(job.runId);
        return;
      }

      await this.processSubmission(job.submissionId);
    } catch (error) {
      this.logger.error(
        `Judge job ${this.toJobKey(job)} failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async processRun(runId: string): Promise<void> {
    const run = await this.judgeRepository.findRunById(runId);
    if (!run || this.isFinalStatus(run.status)) {
      return;
    }

    if (!run.language) {
      await this.finalizeStandaloneRun(
        run,
        this.buildFailedResult(
          'A supported language is required to execute this run.',
        ),
      );
      return;
    }

    run.status = SubmissionStatus.RUNNING;
    run.verdict = 'RUNNING';
    await this.judgeRepository.saveRun(run);

    const executionResult = await this.judgeExecutionService.executeRun({
      expectedOutput: run.expectedOutput,
      language: run.language,
      problem: run.problem,
      sourceCode: run.sourceCode,
      stdin: run.stdin,
    });

    await this.finalizeStandaloneRun(run, executionResult);
  }

  private async processSubmission(submissionId: string): Promise<void> {
    const submission =
      await this.judgeRepository.findSubmissionById(submissionId);
    if (
      !submission ||
      !submission.judgeRun ||
      this.isFinalStatus(submission.status)
    ) {
      return;
    }

    if (!submission.language) {
      await this.finalizeSubmission(
        submission,
        this.buildSubmissionFailure(
          'A supported language is required to evaluate this submission.',
        ),
      );
      return;
    }

    submission.status = SubmissionStatus.RUNNING;
    submission.verdict = 'RUNNING';
    submission.judgeRun.status = SubmissionStatus.RUNNING;
    submission.judgeRun.verdict = 'RUNNING';

    await Promise.all([
      this.judgeRepository.saveRun(submission.judgeRun),
      this.judgeRepository.saveSubmission(submission),
    ]);

    const evaluation = await this.judgeExecutionService.evaluateSubmission({
      expectedOutput: submission.expectedOutput,
      language: submission.language,
      problem: submission.problem,
      sourceCode: submission.sourceCode,
      stdin: submission.stdin,
    });

    await this.finalizeSubmission(submission, evaluation);
  }

  private async finalizeStandaloneRun(
    run: JudgeRunEntity,
    executionResult: JudgeExecutionResult,
  ): Promise<void> {
    run.stdout = executionResult.stdout;
    run.stderr = executionResult.stderr;
    run.compileOutput = executionResult.compileOutput;
    run.status = executionResult.status;
    run.timeMs = executionResult.timeMs;
    run.memoryKb = executionResult.memoryKb;
    run.exitCode = executionResult.exitCode;
    run.verdict = executionResult.verdict || this.inferRunVerdict(run);

    const savedRun = await this.judgeRepository.saveRun(run);
    const linkedSubmissions =
      await this.judgeRepository.findSubmissionsByJudgeRunId(savedRun.id);

    await Promise.all(
      linkedSubmissions.map((submission) =>
        this.finalizeSubmission(
          submission,
          this.toSubmissionEvaluationFromRun(savedRun),
        ),
      ),
    );
  }

  private async finalizeSubmission(
    submission: SubmissionEntity,
    evaluation: JudgeSubmissionEvaluation,
  ): Promise<void> {
    const judgeRun = submission.judgeRun;
    if (!judgeRun) {
      return;
    }

    judgeRun.stdout = evaluation.stdout;
    judgeRun.stderr = evaluation.stderr;
    judgeRun.compileOutput = evaluation.compileOutput;
    judgeRun.status = evaluation.status;
    judgeRun.verdict = evaluation.verdict;
    judgeRun.timeMs = evaluation.timeMs;
    judgeRun.memoryKb = evaluation.memoryKb;
    judgeRun.exitCode = evaluation.exitCode;

    submission.judgeRun = judgeRun;
    submission.stdout = evaluation.stdout;
    submission.stderr = evaluation.stderr;
    submission.compileOutput = evaluation.compileOutput;
    submission.status = evaluation.status;
    submission.verdict = evaluation.verdict;
    submission.timeMs = evaluation.timeMs;
    submission.memoryKb = evaluation.memoryKb;
    submission.exitCode = evaluation.exitCode;
    submission.maxScore = evaluation.maxScore.toFixed(2);
    submission.score = evaluation.score.toFixed(2);

    if (!this.isProcessingStatus(evaluation.status)) {
      submission.evaluatedAt = new Date();
    }

    await Promise.all([
      this.judgeRepository.saveRun(judgeRun),
      this.judgeRepository.saveSubmission(submission),
    ]);
  }

  private buildSubmissionFailure(message: string): JudgeSubmissionEvaluation {
    return {
      compileOutput: message,
      maxScore: 100,
      passedCount: 0,
      score: 0,
      status: SubmissionStatus.FAILED,
      totalCount: 0,
      verdict: 'FAILED',
    };
  }

  private buildFailedResult(message: string): JudgeExecutionResult {
    return {
      compileOutput: message,
      status: SubmissionStatus.FAILED,
      verdict: 'FAILED',
    };
  }

  private toSubmissionEvaluationFromRun(
    run: JudgeRunEntity,
  ): JudgeSubmissionEvaluation {
    return {
      compileOutput: run.compileOutput,
      exitCode: run.exitCode,
      maxScore: 100,
      memoryKb: run.memoryKb,
      passedCount: run.verdict === 'ACCEPTED' ? 1 : 0,
      score: run.verdict === 'ACCEPTED' ? 100 : 0,
      status: run.status,
      stderr: run.stderr,
      stdout: run.stdout,
      timeMs: run.timeMs,
      totalCount: 1,
      verdict: run.verdict || this.inferRunVerdict(run),
    };
  }

  private inferRunVerdict(run: JudgeRunEntity): string {
    if (run.status === SubmissionStatus.COMPILATION_ERROR) {
      return 'COMPILATION_ERROR';
    }

    if (run.status === SubmissionStatus.RUNTIME_ERROR) {
      return 'RUNTIME_ERROR';
    }

    if (run.status === SubmissionStatus.TIME_LIMIT_EXCEEDED) {
      return 'TIME_LIMIT_EXCEEDED';
    }

    if (run.status === SubmissionStatus.MEMORY_LIMIT_EXCEEDED) {
      return 'MEMORY_LIMIT_EXCEEDED';
    }

    if (run.expectedOutput !== undefined && run.stdout !== undefined) {
      return run.expectedOutput.trim() === run.stdout.trim()
        ? 'ACCEPTED'
        : 'WRONG_ANSWER';
    }

    if (run.status === SubmissionStatus.ACCEPTED) {
      return 'ACCEPTED';
    }

    if (run.status === SubmissionStatus.WRONG_ANSWER) {
      return 'WRONG_ANSWER';
    }

    return 'FAILED';
  }

  private getConcurrency(): number {
    const rawValue = Number.parseInt(
      process.env.JUDGE_QUEUE_CONCURRENCY ?? '2',
      10,
    );

    return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 2;
  }

  private isProcessingStatus(status: SubmissionStatus): boolean {
    return (
      status === SubmissionStatus.PENDING || status === SubmissionStatus.RUNNING
    );
  }

  private isFinalStatus(status: SubmissionStatus): boolean {
    return !this.isProcessingStatus(status);
  }

  private toJobKey(job: JudgeQueueJob): string {
    return job.kind === 'run'
      ? `run:${job.runId}`
      : `submission:${job.submissionId}`;
  }

  private getRetryAttempts(): number {
    const rawValue = Number.parseInt(
      process.env.JUDGE_QUEUE_RETRY_ATTEMPTS ?? '3',
      10,
    );

    return Number.isFinite(rawValue) && rawValue >= 1 ? rawValue : 3;
  }

  private shouldUseBullMq(): boolean {
    const driver = (process.env.JUDGE_QUEUE_DRIVER ?? 'auto')
      .trim()
      .toLowerCase();
    if (driver === 'memory') {
      return false;
    }

    if (driver === 'bullmq') {
      return true;
    }

    return Boolean(
      process.env.REDIS_URL?.trim() || process.env.REDIS_HOST?.trim(),
    );
  }

  private createRedisConnection(): IORedis {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (redisUrl) {
      return new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
      });
    }

    return new IORedis({
      db: this.parseIntegerEnv('REDIS_DB', 0),
      host: process.env.REDIS_HOST?.trim() || '127.0.0.1',
      maxRetriesPerRequest: null,
      password: process.env.REDIS_PASSWORD?.trim() || undefined,
      port: this.parseIntegerEnv('REDIS_PORT', 6379),
    });
  }

  private parseIntegerEnv(name: string, fallbackValue: number): number {
    const parsedValue = Number.parseInt(
      process.env[name] ?? `${fallbackValue}`,
      10,
    );
    return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
  }
}
