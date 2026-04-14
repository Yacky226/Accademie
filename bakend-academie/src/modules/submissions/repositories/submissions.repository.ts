import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JudgeRunEntity } from '../../judge/entities/judge-run.entity';
import { ProblemEntity } from '../../problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../../problems/entities/supported-language.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SubmissionEntity } from '../entities/submission.entity';

@Injectable()
export class SubmissionsRepository {
  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly submissionsRepository: Repository<SubmissionEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProblemEntity)
    private readonly problemsRepository: Repository<ProblemEntity>,
    @InjectRepository(SupportedLanguageEntity)
    private readonly languagesRepository: Repository<SupportedLanguageEntity>,
    @InjectRepository(JudgeRunEntity)
    private readonly judgeRunsRepository: Repository<JudgeRunEntity>,
  ) {}

  async findAllSubmissions(): Promise<SubmissionEntity[]> {
    return this.submissionsRepository.find({
      where: { deletedAt: IsNull() },
      relations: {
        requester: true,
        problem: true,
        language: true,
        judgeRun: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findSubmissionById(
    submissionId: string,
  ): Promise<SubmissionEntity | null> {
    return this.submissionsRepository.findOne({
      where: { id: submissionId, deletedAt: IsNull() },
      relations: {
        requester: true,
        problem: { testCases: true },
        language: true,
        judgeRun: true,
      },
    });
  }

  async findSubmissionsByRequesterId(
    requesterId: string,
  ): Promise<SubmissionEntity[]> {
    return this.submissionsRepository.find({
      where: { requester: { id: requesterId }, deletedAt: IsNull() },
      relations: {
        requester: true,
        problem: true,
        language: true,
        judgeRun: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findSubmissionsByProblemId(
    problemId: string,
  ): Promise<SubmissionEntity[]> {
    return this.submissionsRepository.find({
      where: { problem: { id: problemId }, deletedAt: IsNull() },
      relations: {
        requester: true,
        problem: true,
        language: true,
        judgeRun: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findSubmissionsForLeaderboard(): Promise<SubmissionEntity[]> {
    return this.submissionsRepository.find({
      where: { deletedAt: IsNull() },
      relations: {
        requester: true,
        problem: true,
      },
      order: { submittedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async saveSubmission(
    submission: SubmissionEntity,
  ): Promise<SubmissionEntity> {
    return this.submissionsRepository.save(submission);
  }

  async softDeleteSubmission(submission: SubmissionEntity): Promise<void> {
    await this.submissionsRepository.softRemove(submission);
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  async findProblemById(problemId: string): Promise<ProblemEntity | null> {
    return this.problemsRepository.findOne({
      where: { id: problemId, deletedAt: IsNull() },
      relations: { testCases: true },
    });
  }

  async findLanguageById(
    languageId: string,
  ): Promise<SupportedLanguageEntity | null> {
    return this.languagesRepository.findOne({ where: { id: languageId } });
  }

  async findJudgeRunById(judgeRunId: string): Promise<JudgeRunEntity | null> {
    return this.judgeRunsRepository.findOne({
      where: { id: judgeRunId, deletedAt: IsNull() },
    });
  }

  async saveJudgeRun(judgeRun: JudgeRunEntity): Promise<JudgeRunEntity> {
    return this.judgeRunsRepository.save(judgeRun);
  }
}
