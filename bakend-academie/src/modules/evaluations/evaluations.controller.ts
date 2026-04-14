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
import { EVALUATION_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateEvaluationQuestionDto } from './dto/create-evaluation-question.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvaluationAttemptResponseDto } from './dto/evaluation-attempt-response.dto';
import { EvaluationResponseDto } from './dto/evaluation-response.dto';
import { GradeEvaluationAttemptDto } from './dto/grade-evaluation-attempt.dto';
import { SubmitEvaluationAttemptDto } from './dto/submit-evaluation-attempt.dto';
import { UpdateEvaluationQuestionDto } from './dto/update-evaluation-question.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationAttemptEntity } from './entities/evaluation-attempt.entity';
import { EvaluationEntity } from './entities/evaluation.entity';
import { EvaluationsService } from './evaluations.service';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Permissions(EVALUATION_PERMISSIONS.EVALUATIONS_READ)
  @Get()
  async listEvaluations(
    @CurrentUser('roles') roles: string[],
  ): Promise<EvaluationResponseDto[]> {
    const evaluations = this.canReadCorrectAnswers(roles)
      ? await this.evaluationsService.listEvaluations()
      : await this.evaluationsService.listPublishedEvaluations();
    return evaluations.map((evaluation) =>
      this.toEvaluationResponse(evaluation, this.canReadCorrectAnswers(roles)),
    );
  }

  @Permissions(EVALUATION_PERMISSIONS.EVALUATION_ATTEMPTS_SUBMIT)
  @Get('attempts/me')
  async listMyAttempts(
    @CurrentUser('sub') userId: string,
  ): Promise<EvaluationAttemptResponseDto[]> {
    const attempts = await this.evaluationsService.listMyAttempts(userId);
    return attempts.map((attempt) => this.toAttemptResponse(attempt));
  }

  @Permissions(EVALUATION_PERMISSIONS.EVALUATIONS_READ)
  @Get(':id')
  async getEvaluationById(
    @Param('id') id: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<EvaluationResponseDto> {
    const evaluation = this.canReadCorrectAnswers(roles)
      ? await this.evaluationsService.getEvaluationById(id)
      : await this.evaluationsService.getPublishedEvaluationById(id);
    return this.toEvaluationResponse(
      evaluation,
      this.canReadCorrectAnswers(roles),
    );
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(EVALUATION_PERMISSIONS.EVALUATIONS_CREATE)
  @Post()
  async createEvaluation(
    @Body() dto: CreateEvaluationDto,
    @CurrentUser('sub') creatorId: string,
  ): Promise<EvaluationResponseDto> {
    const evaluation = await this.evaluationsService.createEvaluation(
      dto,
      creatorId,
    );
    return this.toEvaluationResponse(evaluation, true);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(EVALUATION_PERMISSIONS.EVALUATIONS_UPDATE)
  @Patch(':id')
  async updateEvaluation(
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationDto,
  ): Promise<EvaluationResponseDto> {
    const evaluation = await this.evaluationsService.updateEvaluation(id, dto);
    return this.toEvaluationResponse(evaluation, true);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(EVALUATION_PERMISSIONS.EVALUATIONS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteEvaluation(@Param('id') id: string): Promise<void> {
    await this.evaluationsService.deleteEvaluation(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(EVALUATION_PERMISSIONS.EVALUATION_QUESTIONS_MANAGE)
  @Post(':id/questions')
  async addQuestion(
    @Param('id') evaluationId: string,
    @Body() dto: CreateEvaluationQuestionDto,
  ) {
    return this.evaluationsService.addQuestion(evaluationId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(EVALUATION_PERMISSIONS.EVALUATION_QUESTIONS_MANAGE)
  @Patch(':id/questions/:questionId')
  async updateQuestion(
    @Param('id') evaluationId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateEvaluationQuestionDto,
  ) {
    return this.evaluationsService.updateQuestion(
      evaluationId,
      questionId,
      dto,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(EVALUATION_PERMISSIONS.EVALUATION_QUESTIONS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/questions/:questionId')
  async deleteQuestion(
    @Param('id') evaluationId: string,
    @Param('questionId') questionId: string,
  ): Promise<void> {
    await this.evaluationsService.deleteQuestion(evaluationId, questionId);
  }

  @Permissions(EVALUATION_PERMISSIONS.EVALUATION_ATTEMPTS_SUBMIT)
  @Post(':id/attempts')
  async submitAttempt(
    @Param('id') evaluationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: SubmitEvaluationAttemptDto,
  ): Promise<EvaluationAttemptResponseDto> {
    const attempt = await this.evaluationsService.submitAttempt(
      evaluationId,
      dto,
      userId,
    );
    return this.toAttemptResponse(attempt);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(EVALUATION_PERMISSIONS.EVALUATION_ATTEMPTS_READ)
  @Get(':id/attempts')
  async listAttempts(
    @Param('id') evaluationId: string,
  ): Promise<EvaluationAttemptResponseDto[]> {
    const attempts = await this.evaluationsService.listAttempts(evaluationId);
    return attempts.map((attempt) => this.toAttemptResponse(attempt));
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(EVALUATION_PERMISSIONS.EVALUATION_ATTEMPTS_GRADE)
  @Patch('attempts/:attemptId/grade')
  async gradeAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser('sub') graderId: string,
    @Body() dto: GradeEvaluationAttemptDto,
  ): Promise<EvaluationAttemptResponseDto> {
    const attempt = await this.evaluationsService.gradeAttempt(
      attemptId,
      dto,
      graderId,
    );
    return this.toAttemptResponse(attempt);
  }

  private toEvaluationResponse(
    evaluation: EvaluationEntity,
    includeCorrectAnswers = false,
  ): EvaluationResponseDto {
    return {
      id: evaluation.id,
      title: evaluation.title,
      slug: evaluation.slug,
      description: evaluation.description,
      type: evaluation.type,
      instructions: evaluation.instructions,
      durationInMinutes: evaluation.durationInMinutes,
      maxAttempts: evaluation.maxAttempts,
      passScore: evaluation.passScore,
      startsAt: evaluation.startsAt,
      endsAt: evaluation.endsAt,
      isPublished: evaluation.isPublished,
      creator: {
        id: evaluation.creator.id,
        firstName: evaluation.creator.firstName,
        lastName: evaluation.creator.lastName,
        email: evaluation.creator.email,
      },
      course: evaluation.course
        ? {
            id: evaluation.course.id,
            title: evaluation.course.title,
            slug: evaluation.course.slug,
          }
        : undefined,
      questions: (evaluation.questions ?? []).map((question) => ({
        id: question.id,
        statement: question.statement,
        questionType: question.questionType,
        options: question.options,
        correctAnswer: includeCorrectAnswers
          ? question.correctAnswer
          : undefined,
        points: question.points,
        position: question.position,
      })),
      attemptsCount: evaluation.attempts?.length ?? 0,
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
    };
  }

  private canReadCorrectAnswers(roles: string[] | undefined): boolean {
    return (roles ?? []).some(
      (role) => role === UserRole.ADMIN || role === UserRole.TEACHER,
    );
  }

  private toAttemptResponse(
    attempt: EvaluationAttemptEntity,
  ): EvaluationAttemptResponseDto {
    return {
      id: attempt.id,
      status: attempt.status,
      answers: attempt.answers,
      score: attempt.score,
      maxScore: attempt.maxScore,
      feedback: attempt.feedback,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      student: {
        id: attempt.student.id,
        firstName: attempt.student.firstName,
        lastName: attempt.student.lastName,
        email: attempt.student.email,
      },
      grader: attempt.grader
        ? {
            id: attempt.grader.id,
            firstName: attempt.grader.firstName,
            lastName: attempt.grader.lastName,
            email: attempt.grader.email,
          }
        : undefined,
      evaluation: {
        id: attempt.evaluation.id,
        title: attempt.evaluation.title,
        slug: attempt.evaluation.slug,
      },
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
    };
  }
}
