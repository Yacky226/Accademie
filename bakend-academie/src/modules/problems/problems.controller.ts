import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PROBLEM_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateProblemDto } from './dto/create-problem.dto';
import { ProblemManagementResponseDto } from './dto/problem-management-response.dto';
import { CreateProblemTagDto } from './dto/create-problem-tag.dto';
import { CreateProblemTestCaseDto } from './dto/create-problem-testcase.dto';
import { CreateSupportedLanguageDto } from './dto/create-supported-language.dto';
import { ProblemResponseDto } from './dto/problem-response.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { ProblemEntity } from './entities/problem.entity';
import { ProblemsService } from './problems.service';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Permissions(PROBLEM_PERMISSIONS.PROBLEMS_READ)
  @Get()
  async listProblems(): Promise<ProblemManagementResponseDto[]> {
    const problems = await this.problemsService.listProblems();
    return problems.map((problem) => this.toManagementResponse(problem));
  }

  @Public()
  @Get('library')
  async listPublishedProblems(): Promise<ProblemResponseDto[]> {
    const problems = await this.problemsService.listPublishedProblems();
    return problems.map((problem) => this.toResponse(problem));
  }

  @Public()
  @Get('library/:slug')
  async getPublishedProblemBySlug(
    @Param('slug') slug: string,
  ): Promise<ProblemResponseDto> {
    const problem = await this.problemsService.getPublishedProblemBySlug(slug);
    return this.toResponse(problem);
  }

  @Permissions(PROBLEM_PERMISSIONS.PROBLEMS_READ)
  @Get(':id')
  async getProblemById(
    @Param('id') id: string,
  ): Promise<ProblemManagementResponseDto> {
    const problem = await this.problemsService.getProblemById(id);
    return this.toManagementResponse(problem);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROBLEM_PERMISSIONS.PROBLEMS_CREATE)
  @Post()
  async createProblem(
    @Body() dto: CreateProblemDto,
    @CurrentUser('sub') creatorId: string,
  ): Promise<ProblemManagementResponseDto> {
    const problem = await this.problemsService.createProblem(dto, creatorId);
    return this.toManagementResponse(problem);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROBLEM_PERMISSIONS.PROBLEMS_UPDATE)
  @Patch(':id')
  async updateProblem(
    @Param('id') id: string,
    @Body() dto: UpdateProblemDto,
  ): Promise<ProblemManagementResponseDto> {
    const problem = await this.problemsService.updateProblem(id, dto);
    return this.toManagementResponse(problem);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(PROBLEM_PERMISSIONS.PROBLEMS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteProblem(@Param('id') id: string): Promise<void> {
    await this.problemsService.deleteProblem(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROBLEM_PERMISSIONS.PROBLEM_TAGS_MANAGE)
  @Post('tags')
  async createTag(@Body() dto: CreateProblemTagDto) {
    return this.problemsService.createTag(dto);
  }

  @Permissions(PROBLEM_PERMISSIONS.PROBLEMS_READ)
  @Get('tags/all')
  async listTags() {
    return this.problemsService.listTags();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROBLEM_PERMISSIONS.PROBLEM_TAGS_MANAGE)
  @Post(':id/tags/:tagId')
  async attachTag(
    @Param('id') problemId: string,
    @Param('tagId') tagId: string,
  ): Promise<ProblemManagementResponseDto> {
    const problem = await this.problemsService.attachTag(problemId, tagId);
    return this.toManagementResponse(problem);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROBLEM_PERMISSIONS.PROBLEM_TAGS_MANAGE)
  @Delete(':id/tags/:tagId')
  async detachTag(
    @Param('id') problemId: string,
    @Param('tagId') tagId: string,
  ): Promise<ProblemManagementResponseDto> {
    const problem = await this.problemsService.detachTag(problemId, tagId);
    return this.toManagementResponse(problem);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROBLEM_PERMISSIONS.PROBLEM_TESTCASES_MANAGE)
  @Post(':id/test-cases')
  async addTestCase(
    @Param('id') problemId: string,
    @Body() dto: CreateProblemTestCaseDto,
  ) {
    return this.problemsService.addTestCase(problemId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROBLEM_PERMISSIONS.PROBLEM_TESTCASES_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/test-cases/:testCaseId')
  async removeTestCase(
    @Param('id') problemId: string,
    @Param('testCaseId') testCaseId: string,
  ): Promise<void> {
    await this.problemsService.removeTestCase(problemId, testCaseId);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(PROBLEM_PERMISSIONS.LANGUAGES_MANAGE)
  @Post('languages')
  async createSupportedLanguage(@Body() dto: CreateSupportedLanguageDto) {
    return this.problemsService.createSupportedLanguage(dto);
  }

  @Permissions(PROBLEM_PERMISSIONS.PROBLEMS_READ)
  @Get('languages/all')
  async listSupportedLanguages() {
    return this.problemsService.listSupportedLanguages();
  }

  @Roles(UserRole.ADMIN)
  @Permissions(PROBLEM_PERMISSIONS.LANGUAGES_MANAGE)
  @Patch('languages/:id/active/:isActive')
  async toggleLanguageActive(
    @Param('id') languageId: string,
    @Param('isActive') isActive: string,
  ) {
    return this.problemsService.toggleLanguageActive(
      languageId,
      isActive === 'true',
    );
  }

  private toResponse(problem: ProblemEntity): ProblemResponseDto {
    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      statement: problem.statement,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      constraints: problem.constraints,
      sampleInput: problem.sampleInput,
      sampleOutput: problem.sampleOutput,
      explanation: problem.explanation,
      difficulty: problem.difficulty,
      status: problem.status,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
      isPublished: problem.isPublished,
      creator: {
        id: problem.creator.id,
        firstName: problem.creator.firstName,
        lastName: problem.creator.lastName,
        email: problem.creator.email,
      },
      tags: (problem.tags ?? []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      testCasesCount: problem.testCases?.length ?? 0,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    };
  }

  private toManagementResponse(
    problem: ProblemEntity,
  ): ProblemManagementResponseDto {
    return {
      ...this.toResponse(problem),
      testCases: (problem.testCases ?? [])
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((testCase) => ({
          createdAt: testCase.createdAt,
          expectedOutput: testCase.expectedOutput,
          id: testCase.id,
          input: testCase.input,
          isHidden: testCase.isHidden,
          points: testCase.points,
          position: testCase.position,
          updatedAt: testCase.updatedAt,
        })),
    };
  }
}
