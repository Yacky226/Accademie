import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProblemEntity } from '../../problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../../problems/entities/supported-language.entity';
import { SubmissionEntity } from '../../submissions/entities/submission.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { JudgeRunEntity } from '../entities/judge-run.entity';

@Injectable()
export class JudgeRepository {
  constructor(
    @InjectRepository(JudgeRunEntity)
    private readonly runsRepository: Repository<JudgeRunEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProblemEntity)
    private readonly problemsRepository: Repository<ProblemEntity>,
    @InjectRepository(SupportedLanguageEntity)
    private readonly languagesRepository: Repository<SupportedLanguageEntity>,
    @InjectRepository(SubmissionEntity)
    private readonly submissionsRepository: Repository<SubmissionEntity>,
  ) {}

  async findAllRuns(): Promise<JudgeRunEntity[]> {
    return this.runsRepository.find({
      where: { deletedAt: IsNull() },
      relations: { requester: true, problem: true, language: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findRunById(runId: string): Promise<JudgeRunEntity | null> {
    return this.runsRepository.findOne({
      where: { id: runId, deletedAt: IsNull() },
      relations: { requester: true, problem: true, language: true },
    });
  }

  async findRunsByRequesterId(requesterId: string): Promise<JudgeRunEntity[]> {
    return this.runsRepository.find({
      where: { requester: { id: requesterId }, deletedAt: IsNull() },
      relations: { requester: true, problem: true, language: true },
      order: { createdAt: 'DESC' },
    });
  }

  async saveRun(run: JudgeRunEntity): Promise<JudgeRunEntity> {
    return this.runsRepository.save(run);
  }

  async findSubmissionsByJudgeRunId(
    judgeRunId: string,
  ): Promise<SubmissionEntity[]> {
    return this.submissionsRepository.find({
      where: { judgeRun: { id: judgeRunId }, deletedAt: IsNull() },
      relations: {
        requester: true,
        problem: { testCases: true },
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

  async saveSubmission(
    submission: SubmissionEntity,
  ): Promise<SubmissionEntity> {
    return this.submissionsRepository.save(submission);
  }

  async softDeleteRun(run: JudgeRunEntity): Promise<void> {
    await this.runsRepository.softRemove(run);
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  async findProblemById(problemId: string): Promise<ProblemEntity | null> {
    return this.problemsRepository.findOne({
      where: { id: problemId, deletedAt: IsNull() },
    });
  }

  async findLanguageById(
    languageId: string,
  ): Promise<SupportedLanguageEntity | null> {
    return this.languagesRepository.findOne({ where: { id: languageId } });
  }
}
