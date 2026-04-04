import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SubmissionStatus } from '../../core/enums';
import { CreateJudgeRunDto } from './dto/create-judge-run.dto';
import { UpdateJudgeRunResultDto } from './dto/update-judge-run-result.dto';
import { JudgeRunEntity } from './entities/judge-run.entity';
import { JudgeRepository } from './repositories/judge.repository';
import { SubmissionEntity } from '../submissions/entities/submission.entity';

@Injectable()
export class JudgeService {
  constructor(private readonly judgeRepository: JudgeRepository) {}

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

  async createRun(requesterId: string, dto: CreateJudgeRunDto): Promise<JudgeRunEntity> {
    const requester = await this.judgeRepository.findUserById(requesterId);
    if (!requester) {
      throw new NotFoundException('Requester user not found');
    }

    const run = new JudgeRunEntity();
    run.token = randomUUID();
    run.sourceCode = dto.sourceCode;
    run.stdin = dto.stdin;
    run.expectedOutput = dto.expectedOutput;
    run.status = SubmissionStatus.PENDING;
    run.verdict = 'PENDING';
    run.requester = requester;

    if (dto.problemId) {
      const problem = await this.judgeRepository.findProblemById(dto.problemId);
      if (!problem) {
        throw new NotFoundException('Problem not found');
      }
      run.problem = problem;
    }

    if (dto.languageId) {
      const language = await this.judgeRepository.findLanguageById(dto.languageId);
      if (!language) {
        throw new NotFoundException('Language not found');
      }
      if (!language.isActive) {
        throw new ConflictException('Language is not active');
      }
      run.language = language;
    }

    return this.judgeRepository.saveRun(run);
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

    const savedRun = await this.judgeRepository.saveRun(run);
    const linkedSubmissions = await this.judgeRepository.findSubmissionsByJudgeRunId(savedRun.id);

    await Promise.all(
      linkedSubmissions.map(async (submission) => {
        this.applyRunResultToSubmission(submission, savedRun);
        await this.judgeRepository.saveSubmission(submission);
      }),
    );

    return savedRun;
  }

  async deleteRun(runId: string): Promise<void> {
    const run = await this.getRunById(runId);
    await this.judgeRepository.softDeleteRun(run);
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

  private applyRunResultToSubmission(submission: SubmissionEntity, run: JudgeRunEntity): void {
    submission.stdout = run.stdout;
    submission.stderr = run.stderr;
    submission.compileOutput = run.compileOutput;
    submission.status = run.status;
    submission.verdict = run.verdict;
    submission.timeMs = run.timeMs;
    submission.memoryKb = run.memoryKb;
    submission.exitCode = run.exitCode;

    if (run.status !== SubmissionStatus.PENDING && run.status !== SubmissionStatus.RUNNING) {
      submission.evaluatedAt = new Date();
      submission.score = run.verdict === 'ACCEPTED' ? '100.00' : '0.00';
    }
  }
}
