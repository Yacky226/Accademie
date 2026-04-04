import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProblemStatus } from '../../../core/enums';
import { UserEntity } from '../../users/entities/user.entity';
import { ProblemEntity } from '../entities/problem.entity';
import { ProblemTagEntity } from '../entities/problem-tag.entity';
import { ProblemTestCaseEntity } from '../entities/problem-testcase.entity';
import { SupportedLanguageEntity } from '../entities/supported-language.entity';

@Injectable()
export class ProblemsRepository {
  constructor(
    @InjectRepository(ProblemEntity)
    private readonly problemsRepository: Repository<ProblemEntity>,
    @InjectRepository(ProblemTagEntity)
    private readonly tagsRepository: Repository<ProblemTagEntity>,
    @InjectRepository(ProblemTestCaseEntity)
    private readonly testCasesRepository: Repository<ProblemTestCaseEntity>,
    @InjectRepository(SupportedLanguageEntity)
    private readonly languagesRepository: Repository<SupportedLanguageEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAllProblems(): Promise<ProblemEntity[]> {
    return this.problemsRepository.find({
      where: { deletedAt: IsNull() },
      relations: { creator: true, testCases: true, tags: true },
      order: { createdAt: 'DESC', testCases: { position: 'ASC' } },
    });
  }

  async findPublishedProblems(): Promise<ProblemEntity[]> {
    return this.problemsRepository.find({
      where: {
        deletedAt: IsNull(),
        isPublished: true,
        status: ProblemStatus.PUBLISHED,
      },
      relations: { creator: true, testCases: true, tags: true },
      order: { createdAt: 'DESC', testCases: { position: 'ASC' } },
    });
  }

  async findProblemById(problemId: string): Promise<ProblemEntity | null> {
    return this.problemsRepository.findOne({
      where: { id: problemId, deletedAt: IsNull() },
      relations: { creator: true, testCases: true, tags: true },
    });
  }

  async findProblemBySlug(slug: string): Promise<ProblemEntity | null> {
    return this.problemsRepository.findOne({ where: { slug, deletedAt: IsNull() } });
  }

  async findPublishedProblemBySlug(slug: string): Promise<ProblemEntity | null> {
    return this.problemsRepository.findOne({
      where: {
        slug,
        deletedAt: IsNull(),
        isPublished: true,
        status: ProblemStatus.PUBLISHED,
      },
      relations: { creator: true, testCases: true, tags: true },
    });
  }

  async saveProblem(problem: ProblemEntity): Promise<ProblemEntity> {
    return this.problemsRepository.save(problem);
  }

  async softDeleteProblem(problem: ProblemEntity): Promise<void> {
    await this.problemsRepository.softRemove(problem);
  }

  async findTagById(tagId: string): Promise<ProblemTagEntity | null> {
    return this.tagsRepository.findOne({ where: { id: tagId } });
  }

  async findTagBySlug(slug: string): Promise<ProblemTagEntity | null> {
    return this.tagsRepository.findOne({ where: { slug } });
  }

  async saveTag(tag: ProblemTagEntity): Promise<ProblemTagEntity> {
    return this.tagsRepository.save(tag);
  }

  async findAllTags(): Promise<ProblemTagEntity[]> {
    return this.tagsRepository.find({ order: { name: 'ASC' } });
  }

  async findTestCaseById(testCaseId: string): Promise<ProblemTestCaseEntity | null> {
    return this.testCasesRepository.findOne({
      where: { id: testCaseId },
      relations: { problem: true },
    });
  }

  async saveTestCase(testCase: ProblemTestCaseEntity): Promise<ProblemTestCaseEntity> {
    return this.testCasesRepository.save(testCase);
  }

  async removeTestCase(testCase: ProblemTestCaseEntity): Promise<void> {
    await this.testCasesRepository.remove(testCase);
  }

  async findLanguageById(languageId: string): Promise<SupportedLanguageEntity | null> {
    return this.languagesRepository.findOne({ where: { id: languageId } });
  }

  async findLanguageBySlug(slug: string): Promise<SupportedLanguageEntity | null> {
    return this.languagesRepository.findOne({ where: { slug } });
  }

  async saveLanguage(language: SupportedLanguageEntity): Promise<SupportedLanguageEntity> {
    return this.languagesRepository.save(language);
  }

  async findAllLanguages(): Promise<SupportedLanguageEntity[]> {
    return this.languagesRepository.find({ order: { name: 'ASC' } });
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id: userId, deletedAt: IsNull() } });
  }
}
