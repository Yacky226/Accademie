import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeEntity } from './entities/grade.entity';
import { GradesRepository } from './repositories/grades.repository';

@Injectable()
export class GradesService {
  constructor(private readonly gradesRepository: GradesRepository) {}

  async listGrades(): Promise<GradeEntity[]> {
    return this.gradesRepository.findAllGrades();
  }

  async listMyGrades(studentId: string): Promise<GradeEntity[]> {
    const student = await this.gradesRepository.findUserById(studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    return this.gradesRepository.findGradesByStudentId(studentId);
  }

  async listGradesByStudent(studentId: string): Promise<GradeEntity[]> {
    const student = await this.gradesRepository.findUserById(studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    return this.gradesRepository.findGradesByStudentId(studentId);
  }

  async getGradeById(gradeId: string): Promise<GradeEntity> {
    const grade = await this.gradesRepository.findGradeById(gradeId);
    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return grade;
  }

  async createGrade(
    dto: CreateGradeDto,
    graderId?: string,
  ): Promise<GradeEntity> {
    this.assertValidScore(dto.score, dto.maxScore);

    const student = await this.gradesRepository.findUserById(dto.studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    const resolvedGraderId = graderId ?? dto.gradedById;
    const gradedBy = resolvedGraderId
      ? ((await this.gradesRepository.findUserById(resolvedGraderId)) ??
        undefined)
      : undefined;
    if (resolvedGraderId && !gradedBy) {
      throw new NotFoundException('Grader user not found');
    }

    const grade = new GradeEntity();
    grade.title = dto.title;
    grade.type = (dto.type ?? 'MANUAL').toUpperCase();
    grade.score = dto.score.toFixed(2);
    grade.maxScore = dto.maxScore.toFixed(2);
    grade.percentage = this.computePercentage(dto.score, dto.maxScore).toFixed(
      2,
    );
    grade.weight = dto.weight !== undefined ? dto.weight.toFixed(2) : undefined;
    grade.feedback = dto.feedback;
    grade.status = (dto.status ?? 'DRAFT').toUpperCase();
    grade.gradedAt = dto.gradedAt ? new Date(dto.gradedAt) : new Date();
    grade.student = student;
    grade.gradedBy = gradedBy;

    if (dto.courseId) {
      const course = await this.gradesRepository.findCourseById(dto.courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      grade.course = course;
    }

    if (dto.evaluationAttemptId) {
      const attempt = await this.gradesRepository.findEvaluationAttemptById(
        dto.evaluationAttemptId,
      );
      if (!attempt) {
        throw new NotFoundException('Evaluation attempt not found');
      }
      grade.evaluationAttempt = attempt;
    }

    return this.gradesRepository.saveGrade(grade);
  }

  async upsertGradeFromEvaluationAttempt(
    attemptId: string,
    options?: {
      graderId?: string;
      score?: number;
      feedback?: string;
      status?: string;
    },
  ): Promise<GradeEntity> {
    const attempt =
      await this.gradesRepository.findEvaluationAttemptById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Evaluation attempt not found');
    }

    const score = options?.score ?? Number(attempt.score ?? 0);
    const maxScore = Number(attempt.maxScore);
    this.assertValidScore(score, maxScore);

    const resolvedGraderId = options?.graderId ?? attempt.grader?.id;
    const gradedBy = resolvedGraderId
      ? ((await this.gradesRepository.findUserById(resolvedGraderId)) ??
        undefined)
      : undefined;
    if (resolvedGraderId && !gradedBy) {
      throw new NotFoundException('Grader user not found');
    }

    const existingGrade =
      await this.gradesRepository.findGradeByEvaluationAttemptId(attempt.id);
    const grade = existingGrade ?? new GradeEntity();
    grade.title = attempt.evaluation.title;
    grade.type = 'EVALUATION';
    grade.score = score.toFixed(2);
    grade.maxScore = maxScore.toFixed(2);
    grade.percentage = this.computePercentage(score, maxScore).toFixed(2);
    grade.feedback = options?.feedback ?? attempt.feedback;
    grade.status = options?.status ?? existingGrade?.status ?? 'PUBLISHED';
    grade.gradedAt = new Date();
    grade.student = attempt.student;
    grade.gradedBy = gradedBy;
    grade.course = attempt.evaluation.course;
    grade.evaluationAttempt = attempt;

    return this.gradesRepository.saveGrade(grade);
  }

  async updateGrade(
    gradeId: string,
    dto: UpdateGradeDto,
  ): Promise<GradeEntity> {
    const grade = await this.getGradeById(gradeId);

    const nextScore = dto.score ?? Number(grade.score);
    const nextMaxScore = dto.maxScore ?? Number(grade.maxScore);
    this.assertValidScore(nextScore, nextMaxScore);

    grade.title = dto.title ?? grade.title;
    grade.type = dto.type ? dto.type.toUpperCase() : grade.type;
    grade.score = nextScore.toFixed(2);
    grade.maxScore = nextMaxScore.toFixed(2);
    grade.percentage = this.computePercentage(nextScore, nextMaxScore).toFixed(
      2,
    );
    grade.weight =
      dto.weight !== undefined ? dto.weight.toFixed(2) : grade.weight;
    grade.feedback = dto.feedback ?? grade.feedback;
    grade.status = dto.status ? dto.status.toUpperCase() : grade.status;
    grade.gradedAt = dto.gradedAt ? new Date(dto.gradedAt) : grade.gradedAt;

    if (dto.courseId) {
      const course = await this.gradesRepository.findCourseById(dto.courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      grade.course = course;
    }

    return this.gradesRepository.saveGrade(grade);
  }

  async publishGrade(gradeId: string): Promise<GradeEntity> {
    const grade = await this.getGradeById(gradeId);
    if (grade.status === 'PUBLISHED') {
      throw new ConflictException('Grade already published');
    }

    grade.status = 'PUBLISHED';
    return this.gradesRepository.saveGrade(grade);
  }

  async deleteGrade(gradeId: string): Promise<void> {
    const grade = await this.getGradeById(gradeId);
    await this.gradesRepository.softDeleteGrade(grade);
  }

  private assertValidScore(score: number, maxScore: number): void {
    if (score < 0 || maxScore <= 0 || score > maxScore) {
      throw new ConflictException('Invalid score values');
    }
  }

  private computePercentage(score: number, maxScore: number): number {
    return (score / maxScore) * 100;
  }
}
