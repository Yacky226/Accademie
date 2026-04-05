import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SubmissionStatus } from '../../core/enums';
import { ProblemEntity } from '../problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../problems/entities/supported-language.entity';
import { CreateJudgeRunDto } from './dto/create-judge-run.dto';
import { UpdateJudgeRunResultDto } from './dto/update-judge-run-result.dto';
import { JudgeRunEntity } from './entities/judge-run.entity';
import { JudgeQueueService } from './judge-queue.service';
import { JudgeRepository } from './repositories/judge.repository';
import { SubmissionEntity } from '../submissions/entities/submission.entity';
import { UserEntity } from '../users/entities/user.entity';

type CreateManagedRunParams = {
  requester: UserEntity;
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  problem?: ProblemEntity;
  language?: SupportedLanguageEntity;
};

@Injectable()
export class JudgeService {
  constructor(
    private readonly judgeRepository: JudgeRepository,
    private readonly judgeQueueService: JudgeQueueService,
  ) {}

  async listRuns(): Promise<JudgeRunEntity[]> {
    return this.judgeRepository.findAllRuns();
  }

  async listMyRuns(requesterId: string): Promise<JudgeRunEntity[]> {
    const requester = await this.judgeRepository.findUserById(requesterId);
    if (!requester) {
      throw new NotFoundException('Requester user not found');
    }

    return this.judgeRepository.findRunsByRequesterId(requesterId);
  }

  async getRunById(runId: string): Promise<JudgeRunEntity> {
    const run = await this.judgeRepository.findRunById(runId);
    if (!run) {
      throw new NotFoundException('Judge run not found');
    }

    return run;
  }

  async createRun(
    requesterId: string,
    dto: CreateJudgeRunDto,
  ): Promise<JudgeRunEntity> {
    const requester = await this.judgeRepository.findUserById(requesterId);
    if (!requester) {
      throw new NotFoundException('Requester user not found');
    }

    let problem: ProblemEntity | undefined;
    if (dto.problemId) {
      const foundProblem = await this.judgeRepository.findProblemById(
        dto.problemId,
      );
      if (!foundProblem) {
        throw new NotFoundException('Problem not found');
      }
      problem = foundProblem;
    }

    let language: SupportedLanguageEntity | undefined;
    if (dto.languageId) {
      const foundLanguage = await this.judgeRepository.findLanguageById(
        dto.languageId,
      );
      if (!foundLanguage) {
        throw new NotFoundException('Language not found');
      }
      if (!foundLanguage.isActive) {
        throw new ConflictException('Language is not active');
      }
      language = foundLanguage;
    }

    const savedRun = await this.createManagedRun({
      expectedOutput: dto.expectedOutput,
      language,
      problem,
      requester,
      sourceCode: dto.sourceCode,
      stdin: dto.stdin,
    });

    this.judgeQueueService.enqueueRun(savedRun.id);

    return savedRun;
  }

  async createSubmissionRun(
    params: CreateManagedRunParams,
  ): Promise<JudgeRunEntity> {
    return this.createManagedRun(params);
  }

  enqueueSubmissionEvaluation(submissionId: string): void {
    this.judgeQueueService.enqueueSubmission(submissionId);
  }

  async updateRunResult(
    runId: string,
    dto: UpdateJudgeRunResultDto,
  ): Promise<JudgeRunEntity> {
    const run = await this.getRunById(runId);

    run.stdout = dto.stdout ?? run.stdout;
    run.stderr = dto.stderr ?? run.stderr;
    run.compileOutput = dto.compileOutput ?? run.compileOutput;
    run.status = dto.status ?? run.status;
    run.timeMs = dto.timeMs ?? run.timeMs;
    run.memoryKb = dto.memoryKb ?? run.memoryKb;
    run.exitCode = dto.exitCode ?? run.exitCode;

    if (dto.verdict) {
      run.verdict = dto.verdict;
    } else {
      run.verdict = this.inferVerdict(run);
    }

    return this.saveRunAndSyncSubmissions(run);
  }

  async deleteRun(runId: string): Promise<void> {
    const run = await this.getRunById(runId);
    await this.judgeRepository.softDeleteRun(run);
  }

  private async createManagedRun(
    params: CreateManagedRunParams,
  ): Promise<JudgeRunEntity> {
    const run = new JudgeRunEntity();
    run.token = randomUUID();
    run.sourceCode = params.sourceCode;
    run.stdin = params.stdin;
    run.expectedOutput = params.expectedOutput;
    run.status = SubmissionStatus.PENDING;
    run.verdict = 'PENDING';
    run.requester = params.requester;
    run.problem = params.problem;
    run.language = params.language;

    return this.judgeRepository.saveRun(run);
  }

  private async saveRunAndSyncSubmissions(
    run: JudgeRunEntity,
  ): Promise<JudgeRunEntity> {
    const savedRun = await this.judgeRepository.saveRun(run);
    const linkedSubmissions =
      await this.judgeRepository.findSubmissionsByJudgeRunId(savedRun.id);

    await Promise.all(
      linkedSubmissions.map(async (submission) => {
        this.applyRunResultToSubmission(submission, savedRun);
        await this.judgeRepository.saveSubmission(submission);
      }),
    );

    return savedRun;
  }

  private inferVerdict(run: JudgeRunEntity): string {
    if (run.status === SubmissionStatus.COMPILATION_ERROR) {
      return 'COMPILATION_ERROR';
    }

    if (run.status === SubmissionStatus.RUNTIME_ERROR) {
      return 'RUNTIME_ERROR';
    }

    if (run.expectedOutput !== undefined && run.stdout !== undefined) {
      const expected = run.expectedOutput.trim();
      const actual = run.stdout.trim();
      return expected === actual ? 'ACCEPTED' : 'WRONG_ANSWER';
    }

    if (run.status === SubmissionStatus.ACCEPTED) {
      return 'ACCEPTED';
    }

    if (run.status === SubmissionStatus.WRONG_ANSWER) {
      return 'WRONG_ANSWER';
    }

    return 'PENDING';
  }

  private applyRunResultToSubmission(
    submission: SubmissionEntity,
    run: JudgeRunEntity,
  ): void {
    submission.stdout = run.stdout;
    submission.stderr = run.stderr;
    submission.compileOutput = run.compileOutput;
    submission.status = run.status;
    submission.verdict = run.verdict;
    submission.timeMs = run.timeMs;
    submission.memoryKb = run.memoryKb;
    submission.exitCode = run.exitCode;

    if (
      run.status !== SubmissionStatus.PENDING &&
      run.status !== SubmissionStatus.RUNNING
    ) {
      submission.evaluatedAt = new Date();
      submission.score = run.verdict === 'ACCEPTED' ? '100.00' : '0.00';
    }
  }
}
