import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProblemDifficulty, ProblemStatus } from '../../core/enums';
import { CreateProblemDto } from './dto/create-problem.dto';
import { CreateProblemTagDto } from './dto/create-problem-tag.dto';
import { CreateProblemTestCaseDto } from './dto/create-problem-testcase.dto';
import { CreateSupportedLanguageDto } from './dto/create-supported-language.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { ProblemEntity } from './entities/problem.entity';
import { ProblemTagEntity } from './entities/problem-tag.entity';
import { ProblemTestCaseEntity } from './entities/problem-testcase.entity';
import { SupportedLanguageEntity } from './entities/supported-language.entity';
import { ProblemsRepository } from './repositories/problems.repository';

@Injectable()
export class ProblemsService {
  constructor(private readonly problemsRepository: ProblemsRepository) {}

  async listProblems(): Promise<ProblemEntity[]> {
    return this.problemsRepository.findAllProblems();
  }

  async listPublishedProblems(): Promise<ProblemEntity[]> {
    return this.problemsRepository.findPublishedProblems();
  }

  async getProblemById(problemId: string): Promise<ProblemEntity> {
    const problem = await this.problemsRepository.findProblemById(problemId);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    return problem;
  }

  async getPublishedProblemBySlug(slug: string): Promise<ProblemEntity> {
    const normalizedSlug = this.normalizeSlug(slug);
    const problem =
      await this.problemsRepository.findPublishedProblemBySlug(normalizedSlug);
    if (!problem) {
      throw new NotFoundException('Published problem not found');
    }

    return problem;
  }

  async createProblem(
    dto: CreateProblemDto,
    creatorId: string,
  ): Promise<ProblemEntity> {
    const normalizedSlug = this.normalizeSlug(dto.slug);
    const existingProblem =
      await this.problemsRepository.findProblemBySlug(normalizedSlug);
    if (existingProblem) {
      throw new ConflictException('Problem slug already exists');
    }

    const creator = await this.problemsRepository.findUserById(creatorId);
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    const problem = new ProblemEntity();
    problem.title = dto.title;
    problem.slug = normalizedSlug;
    problem.statement = dto.statement;
    problem.inputFormat = dto.inputFormat;
    problem.outputFormat = dto.outputFormat;
    problem.constraints = dto.constraints;
    problem.sampleInput = dto.sampleInput;
    problem.sampleOutput = dto.sampleOutput;
    problem.explanation = dto.explanation;
    problem.difficulty = dto.difficulty ?? ProblemDifficulty.EASY;
    problem.status = dto.status ?? ProblemStatus.DRAFT;
    problem.timeLimitMs = dto.timeLimitMs ?? 1000;
    problem.memoryLimitMb = dto.memoryLimitMb ?? 256;
    problem.isPublished = dto.isPublished ?? false;
    problem.creator = creator;
    problem.tags = [];

    return this.problemsRepository.saveProblem(problem);
  }

  async updateProblem(
    problemId: string,
    dto: UpdateProblemDto,
  ): Promise<ProblemEntity> {
    const problem = await this.getProblemById(problemId);

    if (dto.slug && dto.slug !== problem.slug) {
      const normalizedSlug = this.normalizeSlug(dto.slug);
      const existingProblem =
        await this.problemsRepository.findProblemBySlug(normalizedSlug);
      if (existingProblem && existingProblem.id !== problem.id) {
        throw new ConflictException('Problem slug already exists');
      }
      problem.slug = normalizedSlug;
    }

    problem.title = dto.title ?? problem.title;
    problem.statement = dto.statement ?? problem.statement;
    problem.inputFormat = dto.inputFormat ?? problem.inputFormat;
    problem.outputFormat = dto.outputFormat ?? problem.outputFormat;
    problem.constraints = dto.constraints ?? problem.constraints;
    problem.sampleInput = dto.sampleInput ?? problem.sampleInput;
    problem.sampleOutput = dto.sampleOutput ?? problem.sampleOutput;
    problem.explanation = dto.explanation ?? problem.explanation;
    problem.difficulty = dto.difficulty ?? problem.difficulty;
    problem.status = dto.status ?? problem.status;
    problem.timeLimitMs = dto.timeLimitMs ?? problem.timeLimitMs;
    problem.memoryLimitMb = dto.memoryLimitMb ?? problem.memoryLimitMb;
    problem.isPublished = dto.isPublished ?? problem.isPublished;

    return this.problemsRepository.saveProblem(problem);
  }

  async deleteProblem(problemId: string): Promise<void> {
    const problem = await this.getProblemById(problemId);
    await this.problemsRepository.softDeleteProblem(problem);
  }

  async createTag(dto: CreateProblemTagDto): Promise<ProblemTagEntity> {
    const normalizedSlug = this.normalizeSlug(dto.slug);
    const existingTag =
      await this.problemsRepository.findTagBySlug(normalizedSlug);
    if (existingTag) {
      throw new ConflictException('Tag slug already exists');
    }

    const tag = new ProblemTagEntity();
    tag.name = dto.name;
    tag.slug = normalizedSlug;

    return this.problemsRepository.saveTag(tag);
  }

  async listTags(): Promise<ProblemTagEntity[]> {
    return this.problemsRepository.findAllTags();
  }

  async attachTag(problemId: string, tagId: string): Promise<ProblemEntity> {
    const problem = await this.getProblemById(problemId);
    const tag = await this.problemsRepository.findTagById(tagId);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const alreadyAttached = (problem.tags ?? []).some(
      (existingTag) => existingTag.id === tag.id,
    );
    if (!alreadyAttached) {
      problem.tags = [...(problem.tags ?? []), tag];
    }

    return this.problemsRepository.saveProblem(problem);
  }

  async detachTag(problemId: string, tagId: string): Promise<ProblemEntity> {
    const problem = await this.getProblemById(problemId);
    problem.tags = (problem.tags ?? []).filter((tag) => tag.id !== tagId);
    return this.problemsRepository.saveProblem(problem);
  }

  async addTestCase(
    problemId: string,
    dto: CreateProblemTestCaseDto,
  ): Promise<ProblemTestCaseEntity> {
    const problem = await this.getProblemById(problemId);

    const duplicatePosition = (problem.testCases ?? []).find(
      (testCase) => testCase.position === dto.position,
    );
    if (duplicatePosition) {
      throw new ConflictException(
        'A test case already exists at this position',
      );
    }

    const testCase = new ProblemTestCaseEntity();
    testCase.input = dto.input;
    testCase.expectedOutput = dto.expectedOutput;
    testCase.isHidden = dto.isHidden ?? true;
    testCase.points = (dto.points ?? 0).toFixed(2);
    testCase.position = dto.position;
    testCase.problem = problem;

    return this.problemsRepository.saveTestCase(testCase);
  }

  async removeTestCase(problemId: string, testCaseId: string): Promise<void> {
    const testCase = await this.problemsRepository.findTestCaseById(testCaseId);
    if (!testCase || testCase.problem.id !== problemId) {
      throw new NotFoundException('Test case not found');
    }

    await this.problemsRepository.removeTestCase(testCase);
  }

  async createSupportedLanguage(
    dto: CreateSupportedLanguageDto,
  ): Promise<SupportedLanguageEntity> {
    const normalizedSlug = this.normalizeSlug(dto.slug);
    const existingLanguage =
      await this.problemsRepository.findLanguageBySlug(normalizedSlug);
    if (existingLanguage) {
      throw new ConflictException('Language slug already exists');
    }

    const language = new SupportedLanguageEntity();
    language.name = dto.name;
    language.slug = normalizedSlug;
    language.version = dto.version;
    language.judge0LanguageId = dto.judge0LanguageId;
    language.isActive = dto.isActive ?? true;

    return this.problemsRepository.saveLanguage(language);
  }

  async listSupportedLanguages(): Promise<SupportedLanguageEntity[]> {
    return this.problemsRepository.findAllLanguages();
  }

  async toggleLanguageActive(
    languageId: string,
    isActive: boolean,
  ): Promise<SupportedLanguageEntity> {
    const language = await this.problemsRepository.findLanguageById(languageId);
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    language.isActive = isActive;
    return this.problemsRepository.saveLanguage(language);
  }

  private normalizeSlug(slug: string): string {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
