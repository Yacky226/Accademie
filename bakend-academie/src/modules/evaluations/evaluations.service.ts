import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EnrollmentStatus,
  EvaluationType,
  NotificationChannel,
} from '../../core/enums';
import { CoursesRepository } from '../courses/repositories/courses.repository';
import { GradesService } from '../grades/grades.service';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { NotificationsRepository } from '../notifications/repositories/notifications.repository';
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
    private readonly coursesRepository: CoursesRepository,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async listEvaluations(): Promise<EvaluationEntity[]> {
    return this.evaluationsRepository.findAllEvaluations();
  }

  async listPublishedEvaluations(): Promise<EvaluationEntity[]> {
    return this.evaluationsRepository.findPublishedEvaluations();
  }

  async getEvaluationById(evaluationId: string): Promise<EvaluationEntity> {
    const evaluation =
      await this.evaluationsRepository.findEvaluationById(evaluationId);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    return evaluation;
  }

  async getPublishedEvaluationById(
    evaluationId: string,
  ): Promise<EvaluationEntity> {
    const evaluation =
      await this.evaluationsRepository.findPublishedEvaluationById(
        evaluationId,
      );
    if (!evaluation) {
      throw new NotFoundException('Published evaluation not found');
    }

    return evaluation;
  }

  async createEvaluation(
    dto: CreateEvaluationDto,
    creatorId: string,
  ): Promise<EvaluationEntity> {
    const queuedQuestions = dto.questions ?? [];

    if (dto.isPublished && queuedQuestions.length === 0) {
      throw new ConflictException(
        'Add at least one question before publishing the evaluation',
      );
    }

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

    this.assertNoDuplicateQuestionPositions(queuedQuestions);

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

    const savedEvaluation =
      await this.evaluationsRepository.saveEvaluation(evaluation);

    for (const questionDto of queuedQuestions) {
      const question = this.buildQuestionEntity(savedEvaluation, questionDto);
      await this.evaluationsRepository.saveQuestion(question);
    }

    const hydratedEvaluation = await this.getEvaluationById(savedEvaluation.id);

    if (hydratedEvaluation.isPublished) {
      this.assertEvaluationCanBePublished(hydratedEvaluation);
      await this.notifyStudentsAboutPublishedEvaluation(hydratedEvaluation);
    }

    return hydratedEvaluation;
  }

  async updateEvaluation(
    evaluationId: string,
    dto: UpdateEvaluationDto,
  ): Promise<EvaluationEntity> {
    const evaluation = await this.getEvaluationById(evaluationId);
    const wasPublished = evaluation.isPublished;

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

    if (evaluation.isPublished) {
      this.assertEvaluationCanBePublished(evaluation);
    }

    const savedEvaluation =
      await this.evaluationsRepository.saveEvaluation(evaluation);

    if (!wasPublished && savedEvaluation.isPublished) {
      await this.notifyStudentsAboutPublishedEvaluation(savedEvaluation);
    }

    return savedEvaluation;
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

    const question = this.buildQuestionEntity(evaluation, dto);
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

    const normalizedQuestionType = dto.questionType
      ? this.normalizeQuestionType(dto.questionType)
      : question.questionType;
    const normalizedOptions =
      dto.options !== undefined
        ? this.normalizeQuestionOptions(dto.options)
        : question.options;
    const normalizedCorrectAnswer = this.normalizeCorrectAnswer(
      normalizedQuestionType,
      dto.correctAnswer ?? question.correctAnswer,
      normalizedOptions,
    );

    question.statement = dto.statement ?? question.statement;
    question.questionType = normalizedQuestionType;
    question.options = normalizedOptions;
    question.correctAnswer = normalizedCorrectAnswer;
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

    this.assertAllQuestionsAutoGradable(evaluation.questions ?? []);
    this.assertAllQuestionsAnswered(evaluation.questions ?? [], dto.answers);

    const attempt = new EvaluationAttemptEntity();
    attempt.status = 'GRADED';
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
    attempt.score = autoGrade.score.toFixed(2);
    attempt.feedback = autoGrade.feedback;

    const savedAttempt = await this.evaluationsRepository.saveAttempt(attempt);
    await this.gradesService.upsertGradeFromEvaluationAttempt(savedAttempt.id, {
      score: autoGrade.score,
      feedback: autoGrade.feedback,
      status: 'PUBLISHED',
    });

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
  ): { score: number; feedback: string } {
    const submittedAnswers = answers ?? {};
    const totalScore = questions.reduce((score, question) => {
      const submittedAnswer = submittedAnswers[question.id];
      const expectedAnswer = this.parseCorrectAnswer(question.correctAnswer);
      return this.answersMatch(
        question.questionType,
        submittedAnswer,
        expectedAnswer,
      )
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

  private answersMatch(
    questionType: string,
    left: unknown,
    right: unknown,
  ): boolean {
    const normalizedQuestionType = this.normalizeQuestionType(questionType);

    if (
      (normalizedQuestionType === 'FILL_BLANK' ||
        normalizedQuestionType === 'TEXT') &&
      Array.isArray(right)
    ) {
      const normalizedLeft = this.normalizeAnswer(left);
      return right.some(
        (candidate) =>
          JSON.stringify(this.normalizeAnswer(candidate)) ===
          JSON.stringify(normalizedLeft),
      );
    }

    return (
      JSON.stringify(this.normalizeAnswer(left)) ===
      JSON.stringify(this.normalizeAnswer(right))
    );
  }

  private normalizeQuestionType(questionType?: string): string {
    const normalizedValue = questionType?.trim().toUpperCase();

    if (
      normalizedValue === 'MULTIPLE_CHOICE' ||
      normalizedValue === 'MULTIPLE_RESPONSE' ||
      normalizedValue === 'FILL_BLANK' ||
      normalizedValue === 'TEXT'
    ) {
      return normalizedValue;
    }

    if (normalizedValue === 'SHORT_ANSWER') {
      return 'FILL_BLANK';
    }

    return 'TEXT';
  }

  private assertNoDuplicateQuestionPositions(
    questions: CreateEvaluationQuestionDto[],
  ): void {
    const positions = new Set<number>();

    questions.forEach((question) => {
      if (positions.has(question.position)) {
        throw new ConflictException(
          'Each question must use a unique position in the evaluation',
        );
      }

      positions.add(question.position);
    });
  }

  private buildQuestionEntity(
    evaluation: EvaluationEntity,
    dto: CreateEvaluationQuestionDto,
  ): EvaluationQuestionEntity {
    const question = new EvaluationQuestionEntity();
    const normalizedQuestionType = this.normalizeQuestionType(dto.questionType);
    const normalizedOptions = this.normalizeQuestionOptions(dto.options);

    question.statement = dto.statement;
    question.questionType = normalizedQuestionType;
    question.options = normalizedOptions;
    question.correctAnswer = this.normalizeCorrectAnswer(
      normalizedQuestionType,
      dto.correctAnswer,
      normalizedOptions,
    );
    question.points = (dto.points ?? 1).toFixed(2);
    question.position = dto.position;
    question.evaluation = evaluation;

    return question;
  }

  private normalizeQuestionOptions(options?: string[]): string[] | undefined {
    if (!options?.length) {
      return undefined;
    }

    const normalizedOptions = options
      .map((option) => option.trim())
      .filter(Boolean);

    return normalizedOptions.length > 0 ? normalizedOptions : undefined;
  }

  private normalizeCorrectAnswer(
    questionType: string,
    correctAnswer?: string,
    options?: string[],
  ): string {
    const normalizedQuestionType = this.normalizeQuestionType(questionType);
    const normalizedCorrectAnswer = correctAnswer?.trim();

    if (!normalizedCorrectAnswer) {
      throw new ConflictException(
        'A correct answer is required for automatic evaluation',
      );
    }

    if (normalizedQuestionType === 'MULTIPLE_CHOICE') {
      if (!options?.length) {
        throw new ConflictException(
          'Multiple choice questions require answer options',
        );
      }

      if (!options.includes(normalizedCorrectAnswer)) {
        throw new ConflictException(
          'The correct answer must match one of the available options',
        );
      }

      return normalizedCorrectAnswer;
    }

    if (normalizedQuestionType === 'MULTIPLE_RESPONSE') {
      if (!options?.length) {
        throw new ConflictException(
          'Multiple response questions require answer options',
        );
      }

      const parsedAnswer = this.parseCorrectAnswer(normalizedCorrectAnswer);
      const normalizedAnswers = Array.isArray(parsedAnswer)
        ? parsedAnswer
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        : typeof parsedAnswer === 'string' && parsedAnswer.trim()
          ? [parsedAnswer.trim()]
          : [];

      if (!normalizedAnswers.length) {
        throw new ConflictException(
          'Select at least one correct answer for this question',
        );
      }

      const hasInvalidAnswer = normalizedAnswers.some(
        (value) => !options.includes(value),
      );
      if (hasInvalidAnswer) {
        throw new ConflictException(
          'Every correct answer must match one of the available options',
        );
      }

      return JSON.stringify(Array.from(new Set(normalizedAnswers)));
    }

    const parsedAnswer = this.parseCorrectAnswer(normalizedCorrectAnswer);
    const acceptedAnswers = Array.isArray(parsedAnswer)
      ? parsedAnswer
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean)
      : typeof parsedAnswer === 'string' && parsedAnswer.trim()
        ? [parsedAnswer.trim()]
        : [];

    if (!acceptedAnswers.length) {
      throw new ConflictException(
        'Provide at least one accepted answer for this question',
      );
    }

    return acceptedAnswers.length === 1
      ? acceptedAnswers[0]
      : JSON.stringify(acceptedAnswers);
  }

  private assertEvaluationCanBePublished(
    evaluation: EvaluationEntity,
  ): void {
    if (!(evaluation.questions ?? []).length) {
      throw new ConflictException(
        'Publish at least one question before publishing this evaluation',
      );
    }

    this.assertAllQuestionsAutoGradable(evaluation.questions ?? []);
  }

  private assertAllQuestionsAutoGradable(
    questions: EvaluationQuestionEntity[],
  ): void {
    questions.forEach((question) => {
      this.normalizeCorrectAnswer(
        question.questionType,
        question.correctAnswer,
        question.options,
      );
    });
  }

  private assertAllQuestionsAnswered(
    questions: EvaluationQuestionEntity[],
    answers?: Record<string, unknown>,
  ): void {
    const submittedAnswers = answers ?? {};
    const missingAnswer = questions.some((question) => {
      const answer = submittedAnswers[question.id];

      if (Array.isArray(answer)) {
        return answer.length === 0;
      }

      if (typeof answer === 'string') {
        return answer.trim().length === 0;
      }

      return answer === undefined || answer === null;
    });

    if (missingAnswer) {
      throw new ConflictException(
        'All questions must be answered before submission',
      );
    }
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

  private async notifyStudentsAboutPublishedEvaluation(
    evaluation: EvaluationEntity,
  ): Promise<void> {
    if (!evaluation.isPublished || !evaluation.course) {
      return;
    }

    if (
      evaluation.type !== EvaluationType.QUIZ &&
      evaluation.type !== EvaluationType.EXAM
    ) {
      return;
    }

    const enrollments = await this.coursesRepository.findEnrollmentsByCourseId(
      evaluation.course.id,
    );
    const recipients = enrollments.filter(
      (enrollment) => enrollment.status !== EnrollmentStatus.CANCELLED,
    );

    if (!recipients.length) {
      return;
    }

    const evaluationLabel =
      evaluation.type === EvaluationType.EXAM ? 'examen' : 'QCM';
    const notificationTitle =
      evaluation.type === EvaluationType.EXAM
        ? 'Nouvel examen disponible'
        : 'Nouveau QCM disponible';
    const teacherName =
      `${evaluation.creator?.firstName ?? ''} ${evaluation.creator?.lastName ?? ''}`.trim() ||
      'Votre enseignant';

    await Promise.all(
      recipients.map((enrollment) => {
        const notification = new NotificationEntity();
        notification.title = notificationTitle;
        notification.message = `${teacherName} a publie le ${evaluationLabel} "${evaluation.title}" dans "${evaluation.course?.title ?? 'votre formation'}".`;
        notification.type = 'COURSE_UPDATE';
        notification.channel = NotificationChannel.IN_APP;
        notification.metadata = {
          source: 'evaluation-publication',
          kind: 'course',
          evaluationId: evaluation.id,
          evaluationSlug: evaluation.slug,
          evaluationTitle: evaluation.title,
          evaluationType: evaluation.type,
          courseId: evaluation.course?.id,
          courseSlug: evaluation.course?.slug,
          courseTitle: evaluation.course?.title,
          teacherName,
          quote: evaluation.description,
          actionLabel: 'Ouvrir l evaluation',
          actionHref: `/student/evaluations?evaluation=${evaluation.slug}`,
        };
        notification.recipient = enrollment.user;

        if (evaluation.creator) {
          notification.sender = evaluation.creator;
        }

        return this.notificationsRepository.saveNotification(notification);
      }),
    );
  }
}
