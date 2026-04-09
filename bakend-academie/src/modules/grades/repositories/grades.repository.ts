import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { EvaluationAttemptEntity } from '../../evaluations/entities/evaluation-attempt.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { GradeEntity } from '../entities/grade.entity';

@Injectable()
export class GradesRepository {
  constructor(
    @InjectRepository(GradeEntity)
    private readonly gradesRepository: Repository<GradeEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(EvaluationAttemptEntity)
    private readonly attemptsRepository: Repository<EvaluationAttemptEntity>,
  ) {}

  async findAllGrades(): Promise<GradeEntity[]> {
    return this.gradesRepository.find({
      where: { deletedAt: IsNull() },
      relations: {
        student: true,
        gradedBy: true,
        course: true,
        evaluationAttempt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findGradeById(gradeId: string): Promise<GradeEntity | null> {
    return this.gradesRepository.findOne({
      where: { id: gradeId, deletedAt: IsNull() },
      relations: {
        student: true,
        gradedBy: true,
        course: true,
        evaluationAttempt: true,
      },
    });
  }

  async findGradesByStudentId(studentId: string): Promise<GradeEntity[]> {
    return this.gradesRepository.find({
      where: { student: { id: studentId }, deletedAt: IsNull() },
      relations: {
        student: true,
        gradedBy: true,
        course: true,
        evaluationAttempt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findPublishedGradesForLeaderboard(): Promise<GradeEntity[]> {
    return this.gradesRepository.find({
      where: { deletedAt: IsNull(), status: 'PUBLISHED' },
      relations: {
        student: true,
        course: true,
      },
      order: { gradedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findGradeByEvaluationAttemptId(
    evaluationAttemptId: string,
  ): Promise<GradeEntity | null> {
    return this.gradesRepository.findOne({
      where: {
        evaluationAttempt: { id: evaluationAttemptId },
        deletedAt: IsNull(),
      },
      relations: {
        student: true,
        gradedBy: true,
        course: true,
        evaluationAttempt: true,
      },
    });
  }

  async saveGrade(grade: GradeEntity): Promise<GradeEntity> {
    return this.gradesRepository.save(grade);
  }

  async softDeleteGrade(grade: GradeEntity): Promise<void> {
    await this.gradesRepository.softRemove(grade);
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  async findCourseById(courseId: string): Promise<CourseEntity | null> {
    return this.coursesRepository.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });
  }

  async findEvaluationAttemptById(
    attemptId: string,
  ): Promise<EvaluationAttemptEntity | null> {
    return this.attemptsRepository.findOne({
      where: { id: attemptId },
      relations: {
        student: true,
        grader: true,
        evaluation: { course: true },
      },
    });
  }
}
