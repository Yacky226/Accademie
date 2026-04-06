import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EvaluationType } from '../../core/enums';
import { GradesService } from '../grades/grades.service';
import { CreateEvaluationQuestionDto } from './dto/create-evaluation-question.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { GradeEvaluationAttemptDto } from './dto/grade-evaluation-attempt.dto';
import { SubmitEvaluationAttemptDto } from './dto/submit-evaluation-attempt.dto';
import { UpdateEvaluationQuestionDto } from './dto/update-evaluation-question.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationAttemptEntity } from './entities/evaluation-attempt.entity';
import { EvaluationEntity } from './entities/evaluation.entity';
import { EvaluationQuestionEntity } from './entities/evaluation-question.entity';
import { EvaluationsRepository } from './repositories/evaluations.repository';

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly evaluationsRepository: EvaluationsRepository,
    private readonly gradesService: GradesService,
  ) {}

  async listEvaluations(): Promise<EvaluationEntity[]> {
    return this.evaluationsRepository.findAllEvaluations();
  }

  async getEvaluationById(evaluationId: string): Promise<EvaluationEntity> {
    const evaluation =
      await this.evaluationsRepository.findEvaluationById(evaluationId);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    return evaluation;
  }

  async createEvaluation(
    dto: CreateEvaluationDto,
    creatorId: string,
  ): Promise<EvaluationEntity> {
    const normalizedSlug = this.normalizeSlug(dto.slug);
    const existingEvaluation =
      await this.evaluationsRepository.findEvaluationBySlug(normalizedSlug);
    if (existingEvaluation) {
      throw new ConflictException('Evaluation slug already exists');
    }

    const creator = await this.evaluationsRepository.findUserById(creatorId);
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    const evaluation = new EvaluationEntity();
    evaluation.title = dto.title;
    evaluation.slug = normalizedSlug;
    evaluation.description = dto.description;
    evaluation.type = dto.type ?? EvaluationType.QUIZ;
    evaluation.instructions = dto.instructions;
    evaluation.durationInMinutes = dto.durationInMinutes;
    evaluation.maxAttempts = dto.maxAttempts ?? 1;
    evaluation.passScore = (dto.passScore ?? 0).toFixed(2);
    evaluation.startsAt = dto.startsAt ? new Date(dto.startsAt) : undefined;
    evaluation.endsAt = dto.endsAt ? new Date(dto.endsAt) : undefined;
    evaluation.isPublished = dto.isPublished ?? false;
    evaluation.creator = creator;

    if (dto.courseId) {
      const course = await this.evaluationsRepository.findCourseById(
        dto.courseId,
      );
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      evaluation.course = course;
    }

    return this.evaluationsRepository.saveEvaluation(evaluation);
  }

  async updateEvaluation(
    evaluationId: string,
    dto: UpdateEvaluationDto,
  ): Promise<EvaluationEntity> {
    const evaluation = await this.getEvaluationById(evaluationId);

    if (dto.slug && this.normalizeSlug(dto.slug) !== evaluation.slug) {
      const existingEvaluation =
        await this.evaluationsRepository.findEvaluationBySlug(
          this.normalizeSlug(dto.slug),
        );
      if (existingEvaluation && existingEvaluation.id !== evaluation.id) {
        throw new ConflictException('Evaluation slug already exists');
      }
      evaluation.slug = this.normalizeSlug(dto.slug);
    }

    evaluation.title = dto.title ?? evaluation.title;
    evaluation.description = dto.description ?? evaluation.description;
    evaluation.type = dto.type ?? evaluation.type;
    evaluation.instructions = dto.instructions ?? evaluation.instructions;
    evaluation.durationInMinutes =
      dto.durationInMinutes ?? evaluation.durationInMinutes;
    evaluation.maxAttempts = dto.maxAttempts ?? evaluation.maxAttempts;
    evaluation.passScore =
      dto.passScore !== undefined
        ? dto.passScore.toFixed(2)
        : evaluation.passScore;
    evaluation.startsAt = dto.startsAt
      ? new Date(dto.startsAt)
      : evaluation.startsAt;
    evaluation.endsAt = dto.endsAt ? new Date(dto.endsAt) : evaluation.endsAt;
    evaluation.isPublished = dto.isPublished ?? evaluation.isPublished;

    if (dto.courseId) {
      const course = await this.evaluationsRepository.findCourseById(
        dto.courseId,
      );
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      evaluation.course = course;
    }

    return this.evaluationsRepository.saveEvaluation(evaluation);
  }

  async deleteEvaluation(evaluationId: string): Promise<void> {
    const evaluation = await this.getEvaluationById(evaluationId);
    await this.evaluationsRepository.softDeleteEvaluation(evaluation);
  }

  async addQuestion(
    evaluationId: string,
    dto: CreateEvaluationQuestionDto,
  ): Promise<EvaluationQuestionEntity> {
    const evaluation = await this.getEvaluationById(evaluationId);

    const duplicatePosition = (evaluation.questions ?? []).find(
      (question) => question.position === dto.position,
    );
    if (duplicatePosition) {
      throw new ConflictException('A question already exists at this position');
    }

    const question = new EvaluationQuestionEntity();
    question.statement = dto.statement;
    question.questionType = (dto.questionType ?? 'TEXT').toUpperCase();
    question.options = dto.options;
    question.correctAnswer = dto.correctAnswer;
    question.points = (dto.points ?? 1).toFixed(2);
    question.position = dto.position;
    question.evaluation = evaluation;

    return this.evaluationsRepository.saveQuestion(question);
  }

  async updateQuestion(
    evaluationId: string,
    questionId: string,
    dto: UpdateEvaluationQuestionDto,
  ): Promise<EvaluationQuestionEntity> {
    const question =
      await this.evaluationsRepository.findQuestionById(questionId);
    if (!question || question.evaluation.id !== evaluationId) {
      throw new NotFoundException('Evaluation question not found');
    }

    if (dto.position !== undefined) {
      const evaluation = await this.getEvaluationById(evaluationId);
      const duplicatePosition = (evaluation.questions ?? []).find(
        (evaluationQuestion) =>
          evaluationQuestion.position === dto.position &&
          evaluationQuestion.id !== question.id,
      );
      if (duplicatePosition) {
        throw new ConflictException(
          'A question already exists at this position',
        );
      }
    }

    question.statement = dto.statement ?? question.statement;
    question.questionType = dto.questionType
      ? dto.questionType.toUpperCase()
      : question.questionType;
    question.options = dto.options ?? question.options;
    question.correctAnswer = dto.correctAnswer ?? question.correctAnswer;
    question.points =
      dto.points !== undefined ? dto.points.toFixed(2) : question.points;
    question.position = dto.position ?? question.position;

    return this.evaluationsRepository.saveQuestion(question);
  }

  async deleteQuestion(
    evaluationId: string,
    questionId: string,
  ): Promise<void> {
    const question =
      await this.evaluationsRepository.findQuestionById(questionId);
    if (!question || question.evaluation.id !== evaluationId) {
      throw new NotFoundException('Evaluation question not found');
    }

    await this.evaluationsRepository.removeQuestion(question);
  }

  async submitAttempt(
    evaluationId: string,
    dto: SubmitEvaluationAttemptDto,
    studentId: string,
  ): Promise<EvaluationAttemptEntity> {
    const evaluation = await this.getEvaluationById(evaluationId);
    if (!evaluation.isPublished) {
      throw new ConflictException('Evaluation is not published');
    }

    const now = new Date();
    if (evaluation.startsAt && now < evaluation.startsAt) {
      throw new ConflictException('Evaluation has not started yet');
    }

    if (evaluation.endsAt && now > evaluation.endsAt) {
      throw new ConflictException('Evaluation has already ended');
    }

    if (!(evaluation.questions ?? []).length) {
      throw new ConflictException(
        'Evaluation must contain at least one question before submission',
      );
    }

    const student = await this.evaluationsRepository.findUserById(studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    const existingAttempts =
      await this.evaluationsRepository.countAttemptsByStudent(
        evaluationId,
        studentId,
      );
    if (existingAttempts >= evaluation.maxAttempts) {
      throw new ConflictException(
        'Maximum attempts reached for this evaluation',
      );
    }

    const attempt = new EvaluationAttemptEntity();
    attempt.status = 'SUBMITTED';
    attempt.answers = dto.answers ?? {};
    attempt.maxScore = this.computeMaxScore(evaluation.questions ?? []).toFixed(
      2,
    );
    attempt.startedAt = now;
    attempt.submittedAt = now;
    attempt.student = student;
    attempt.evaluation = evaluation;
    const autoGrade = this.tryAutoGradeAttempt(
      evaluation.questions ?? [],
      attempt.answers,
    );
    if (autoGrade) {
      attempt.status = 'GRADED';
      attempt.score = autoGrade.score.toFixed(2);
      attempt.feedback = autoGrade.feedback;
    }

    const savedAttempt = await this.evaluationsRepository.saveAttempt(attempt);
    if (autoGrade) {
      await this.gradesService.upsertGradeFromEvaluationAttempt(
        savedAttempt.id,
        {
          score: autoGrade.score,
          feedback: autoGrade.feedback,
          status: 'PUBLISHED',
        },
      );
    }

    return savedAttempt;
  }

  async listAttempts(evaluationId: string): Promise<EvaluationAttemptEntity[]> {
    await this.getEvaluationById(evaluationId);
    return this.evaluationsRepository.findAttemptsByEvaluationId(evaluationId);
  }

  async listMyAttempts(studentId: string): Promise<EvaluationAttemptEntity[]> {
    const student = await this.evaluationsRepository.findUserById(studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    return this.evaluationsRepository.findAttemptsByStudentId(studentId);
  }

  async gradeAttempt(
    attemptId: string,
    dto: GradeEvaluationAttemptDto,
    graderId: string,
  ): Promise<EvaluationAttemptEntity> {
    const attempt = await this.evaluationsRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Evaluation attempt not found');
    }

    const grader = await this.evaluationsRepository.findUserById(graderId);
    if (!grader) {
      throw new NotFoundException('Grader user not found');
    }

    const maxScore = Number(attempt.maxScore);
    if (dto.score > maxScore) {
      throw new ConflictException('Score cannot exceed max score');
    }

    attempt.status = 'GRADED';
    attempt.score = dto.score.toFixed(2);
    attempt.feedback = dto.feedback;
    attempt.grader = grader;

    const savedAttempt = await this.evaluationsRepository.saveAttempt(attempt);
    await this.gradesService.upsertGradeFromEvaluationAttempt(savedAttempt.id, {
      graderId,
      score: dto.score,
      feedback: dto.feedback,
      status: 'PUBLISHED',
    });

    return savedAttempt;
  }

  private computeMaxScore(questions: EvaluationQuestionEntity[]): number {
    return questions.reduce(
      (total, question) => total + Number(question.points),
      0,
    );
  }

  private normalizeSlug(slug: string): string {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private tryAutoGradeAttempt(
    questions: EvaluationQuestionEntity[],
    answers?: Record<string, unknown>,
  ): { score: number; feedback: string } | null {
    if (!questions.length) {
      return null;
    }

    const submittedAnswers = answers ?? {};
    const isFullyAutoGradable = questions.every(
      (question) => question.correctAnswer !== undefined,
    );
    if (!isFullyAutoGradable) {
      return null;
    }

    const totalScore = questions.reduce((score, question) => {
      const submittedAnswer = submittedAnswers[question.id];
      const expectedAnswer = this.parseCorrectAnswer(question.correctAnswer);
      return this.answersMatch(submittedAnswer, expectedAnswer)
        ? score + Number(question.points)
        : score;
    }, 0);
    const maxScore = this.computeMaxScore(questions);

    return {
      score: totalScore,
      feedback: `Correction automatique: ${totalScore.toFixed(2)}/${maxScore.toFixed(2)}`,
    };
  }

  private parseCorrectAnswer(value?: string): unknown {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value.trim();
    }
  }

  private answersMatch(left: unknown, right: unknown): boolean {
    return (
      JSON.stringify(this.normalizeAnswer(left)) ===
      JSON.stringify(this.normalizeAnswer(right))
    );
  }

  private normalizeAnswer(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.normalizeAnswer(item))
        .sort((left, right) =>
          JSON.stringify(left).localeCompare(JSON.stringify(right)),
        );
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .reduce<Record<string, unknown>>((normalized, [key, nestedValue]) => {
          normalized[key] = this.normalizeAnswer(nestedValue);
          return normalized;
        }, {});
    }

    return value;
  }
}
