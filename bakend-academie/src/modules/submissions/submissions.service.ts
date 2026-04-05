import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionStatus } from '../../core/enums';
import { JudgeRunEntity } from '../judge/entities/judge-run.entity';
import { JudgeService } from '../judge/judge.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionResultDto } from './dto/update-submission-result.dto';
import { SubmissionEntity } from './entities/submission.entity';
import { SubmissionsRepository } from './repositories/submissions.repository';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly submissionsRepository: SubmissionsRepository,
    private readonly judgeService: JudgeService,
  ) {}

  async listSubmissions(): Promise<SubmissionEntity[]> {
    return this.submissionsRepository.findAllSubmissions();
  }

  async listMySubmissions(requesterId: string): Promise<SubmissionEntity[]> {
    const requester =
      await this.submissionsRepository.findUserById(requesterId);
    if (!requester) {
      throw new NotFoundException('Requester user not found');
    }

    return this.submissionsRepository.findSubmissionsByRequesterId(requesterId);
  }

  async listSubmissionsByProblem(
    problemId: string,
  ): Promise<SubmissionEntity[]> {
    const problem = await this.submissionsRepository.findProblemById(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    return this.submissionsRepository.findSubmissionsByProblemId(problemId);
  }

  async getSubmissionById(submissionId: string): Promise<SubmissionEntity> {
    const submission =
      await this.submissionsRepository.findSubmissionById(submissionId);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  async createSubmission(
    requesterId: string,
    dto: CreateSubmissionDto,
  ): Promise<SubmissionEntity> {
    const requester =
      await this.submissionsRepository.findUserById(requesterId);
    if (!requester) {
      throw new NotFoundException('Requester user not found');
    }

    const submission = new SubmissionEntity();
    submission.sourceCode = dto.sourceCode;
    submission.stdin = dto.stdin;
    submission.expectedOutput = dto.expectedOutput;
    submission.status = SubmissionStatus.PENDING;
    submission.verdict = 'PENDING';
    submission.maxScore = '100.00';
    submission.submittedAt = new Date();
    submission.requester = requester;

    if (dto.problemId) {
      const problem = await this.submissionsRepository.findProblemById(
        dto.problemId,
      );
      if (!problem) {
        throw new NotFoundException('Problem not found');
      }
      submission.problem = problem;
    }

    if (dto.languageId) {
      const language = await this.submissionsRepository.findLanguageById(
        dto.languageId,
      );
      if (!language) {
        throw new NotFoundException('Language not found');
      }
      if (!language.isActive) {
        throw new ConflictException('Language is not active');
      }
      submission.language = language;
    }

    if (dto.judgeRunId) {
      const judgeRun = await this.submissionsRepository.findJudgeRunById(
        dto.judgeRunId,
      );
      if (!judgeRun) {
        throw new NotFoundException('Judge run not found');
      }
      this.applyJudgeRunResult(submission, judgeRun);
    } else if (submission.language) {
      const run = await this.judgeService.createSubmissionRun({
        expectedOutput: submission.expectedOutput,
        language: submission.language,
        problem: submission.problem,
        requester,
        sourceCode: submission.sourceCode,
        stdin: submission.stdin,
      });
      this.applyJudgeRunResult(submission, run);
    }

    const savedSubmission =
      await this.submissionsRepository.saveSubmission(submission);

    if (
      !dto.judgeRunId &&
      savedSubmission.judgeRun &&
      savedSubmission.language
    ) {
      this.judgeService.enqueueSubmissionEvaluation(savedSubmission.id);
    }

    return savedSubmission;
  }

  async updateSubmissionResult(
    submissionId: string,
    dto: UpdateSubmissionResultDto,
  ): Promise<SubmissionEntity> {
    const submission = await this.getSubmissionById(submissionId);

    submission.stdout = dto.stdout ?? submission.stdout;
    submission.stderr = dto.stderr ?? submission.stderr;
    submission.compileOutput = dto.compileOutput ?? submission.compileOutput;
    submission.status = dto.status ?? submission.status;
    submission.verdict = dto.verdict ?? submission.verdict;
    submission.maxScore =
      dto.maxScore !== undefined
        ? dto.maxScore.toFixed(2)
        : submission.maxScore;
    submission.score =
      dto.score !== undefined ? dto.score.toFixed(2) : submission.score;
    submission.timeMs = dto.timeMs ?? submission.timeMs;
    submission.memoryKb = dto.memoryKb ?? submission.memoryKb;
    submission.exitCode = dto.exitCode ?? submission.exitCode;
    submission.evaluatedAt = new Date();

    if (!submission.verdict) {
      submission.verdict = this.inferVerdict(submission);
    }

    if (submission.score === undefined && submission.verdict) {
      submission.score = this.computeScoreFromVerdict(
        submission.verdict,
      ).toFixed(2);
    }

    if (submission.judgeRun) {
      submission.judgeRun.stdout = submission.stdout;
      submission.judgeRun.stderr = submission.stderr;
      submission.judgeRun.compileOutput = submission.compileOutput;
      submission.judgeRun.status = submission.status;
      submission.judgeRun.verdict = submission.verdict;
      submission.judgeRun.timeMs = submission.timeMs;
      submission.judgeRun.memoryKb = submission.memoryKb;
      submission.judgeRun.exitCode = submission.exitCode;
      await this.submissionsRepository.saveJudgeRun(submission.judgeRun);
    }

    return this.submissionsRepository.saveSubmission(submission);
  }

  async deleteSubmission(submissionId: string): Promise<void> {
    const submission = await this.getSubmissionById(submissionId);
    await this.submissionsRepository.softDeleteSubmission(submission);
  }

  private inferVerdict(submission: SubmissionEntity): string {
    if (submission.status === SubmissionStatus.COMPILATION_ERROR) {
      return 'COMPILATION_ERROR';
    }

    if (submission.status === SubmissionStatus.RUNTIME_ERROR) {
      return 'RUNTIME_ERROR';
    }

    if (
      submission.expectedOutput !== undefined &&
      submission.stdout !== undefined
    ) {
      return submission.expectedOutput.trim() === submission.stdout.trim()
        ? 'ACCEPTED'
        : 'WRONG_ANSWER';
    }

    if (submission.status === SubmissionStatus.ACCEPTED) {
      return 'ACCEPTED';
    }

    if (submission.status === SubmissionStatus.WRONG_ANSWER) {
      return 'WRONG_ANSWER';
    }

    return 'PENDING';
  }

  private computeScoreFromVerdict(verdict?: string): number {
    return verdict === 'ACCEPTED' ? 100 : 0;
  }

  private applyJudgeRunResult(
    submission: SubmissionEntity,
    judgeRun: JudgeRunEntity,
  ): void {
    submission.judgeRun = judgeRun;
    submission.stdout = judgeRun.stdout;
    submission.stderr = judgeRun.stderr;
    submission.compileOutput = judgeRun.compileOutput;
    submission.status = judgeRun.status;
    submission.verdict = judgeRun.verdict;
    submission.timeMs = judgeRun.timeMs;
    submission.memoryKb = judgeRun.memoryKb;
    submission.exitCode = judgeRun.exitCode;

    if (
      judgeRun.status !== SubmissionStatus.PENDING &&
      judgeRun.status !== SubmissionStatus.RUNNING
    ) {
      submission.evaluatedAt = new Date();
      submission.score = this.computeScoreFromVerdict(judgeRun.verdict).toFixed(
        2,
      );
    }
  }
}
