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
import { SUBMISSION_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import {
  SubmissionEvaluationResponseDto,
  SubmissionEvaluationTestResultResponseDto,
} from './dto/submission-evaluation-response.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';
import { UpdateSubmissionResultDto } from './dto/update-submission-result.dto';
import { SubmissionEntity } from './entities/submission.entity';
import { SubmissionsService } from './submissions.service';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_READ)
  @Get()
  async listSubmissions(): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionsService.listSubmissions();
    return submissions.map((submission) => this.toResponse(submission));
  }

  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_READ)
  @Get('me')
  async listMySubmissions(
    @CurrentUser('sub') userId: string,
  ): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionsService.listMySubmissions(userId);
    return submissions.map((submission) => this.toResponse(submission));
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_READ)
  @Get('problem/:problemId')
  async listSubmissionsByProblem(
    @Param('problemId') problemId: string,
  ): Promise<SubmissionResponseDto[]> {
    const submissions =
      await this.submissionsService.listSubmissionsByProblem(problemId);
    return submissions.map((submission) => this.toResponse(submission));
  }

  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_READ)
  @Get(':id')
  async getSubmissionById(
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
    @Param('id') id: string,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.submissionsService.getSubmissionByIdForViewer(
      id,
      userId,
      roles,
    );
    return this.toResponse(submission);
  }

  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_READ)
  @Get(':id/evaluation')
  async getSubmissionEvaluationById(
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
    @Param('id') id: string,
  ): Promise<SubmissionEvaluationResponseDto> {
    const submission = await this.submissionsService.getSubmissionByIdForViewer(
      id,
      userId,
      roles,
    );
    const evaluation = await this.submissionsService.getSubmissionEvaluationById(
      id,
      userId,
      roles,
    );

    return this.toEvaluationResponse(submission, evaluation);
  }

  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_CREATE)
  @Post()
  async createSubmission(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.submissionsService.createSubmission(
      userId,
      dto,
    );
    return this.toResponse(submission);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_EVALUATE)
  @Patch(':id/result')
  async updateSubmissionResult(
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionResultDto,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.submissionsService.updateSubmissionResult(
      id,
      dto,
    );
    return this.toResponse(submission);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteSubmission(@Param('id') id: string): Promise<void> {
    await this.submissionsService.deleteSubmission(id);
  }

  private toResponse(submission: SubmissionEntity): SubmissionResponseDto {
    return {
      id: submission.id,
      sourceCode: submission.sourceCode,
      stdin: submission.stdin,
      expectedOutput: submission.expectedOutput,
      stdout: submission.stdout,
      stderr: submission.stderr,
      compileOutput: submission.compileOutput,
      status: submission.status,
      verdict: submission.verdict,
      score: submission.score,
      maxScore: submission.maxScore,
      timeMs: submission.timeMs,
      memoryKb: submission.memoryKb,
      exitCode: submission.exitCode,
      submittedAt: submission.submittedAt,
      evaluatedAt: submission.evaluatedAt,
      requester: {
        id: submission.requester.id,
        firstName: submission.requester.firstName,
        lastName: submission.requester.lastName,
        email: submission.requester.email,
      },
      problem: submission.problem
        ? {
            id: submission.problem.id,
            title: submission.problem.title,
            slug: submission.problem.slug,
          }
        : undefined,
      language: submission.language
        ? {
            id: submission.language.id,
            name: submission.language.name,
            slug: submission.language.slug,
          }
        : undefined,
      judgeRunId: submission.judgeRun?.id,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  private toEvaluationResponse(
    submission: SubmissionEntity,
    evaluation: Awaited<
      ReturnType<SubmissionsService['getSubmissionEvaluationById']>
    >,
  ): SubmissionEvaluationResponseDto {
    return {
      ...this.toResponse(submission),
      compileOutput: evaluation.compileOutput,
      exitCode: evaluation.exitCode,
      maxScore: evaluation.maxScore.toFixed(2),
      memoryKb: evaluation.memoryKb,
      passedCount: evaluation.passedCount,
      score: evaluation.score.toFixed(2),
      status: evaluation.status,
      stderr: evaluation.stderr,
      stdout: evaluation.stdout,
      testResults: evaluation.testResults.map(
        (testResult): SubmissionEvaluationTestResultResponseDto => ({
          compileOutput: testResult.compileOutput,
          exitCode: testResult.exitCode,
          expectedOutput: testResult.expectedOutput,
          input: testResult.input,
          isHidden: testResult.isHidden,
          memoryKb: testResult.memoryKb,
          passed: testResult.passed,
          points: testResult.points,
          position: testResult.position,
          status: testResult.status,
          stderr: testResult.stderr,
          stdout: testResult.stdout,
          timeMs: testResult.timeMs,
          verdict: testResult.verdict,
        }),
      ),
      timeMs: evaluation.timeMs,
      totalCount: evaluation.totalCount,
      verdict: evaluation.verdict,
    };
  }
}
