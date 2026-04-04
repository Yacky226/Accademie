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
  async listMySubmissions(@CurrentUser('sub') userId: string): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionsService.listMySubmissions(userId);
    return submissions.map((submission) => this.toResponse(submission));
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_READ)
  @Get('problem/:problemId')
  async listSubmissionsByProblem(
    @Param('problemId') problemId: string,
  ): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionsService.listSubmissionsByProblem(problemId);
    return submissions.map((submission) => this.toResponse(submission));
  }

  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_READ)
  @Get(':id')
  async getSubmissionById(@Param('id') id: string): Promise<SubmissionResponseDto> {
    const submission = await this.submissionsService.getSubmissionById(id);
    return this.toResponse(submission);
  }

  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_CREATE)
  @Post()
  async createSubmission(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSubmissionDto,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.submissionsService.createSubmission(userId, dto);
    return this.toResponse(submission);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(SUBMISSION_PERMISSIONS.SUBMISSIONS_EVALUATE)
  @Patch(':id/result')
  async updateSubmissionResult(
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionResultDto,
  ): Promise<SubmissionResponseDto> {
    const submission = await this.submissionsService.updateSubmissionResult(id, dto);
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
}
