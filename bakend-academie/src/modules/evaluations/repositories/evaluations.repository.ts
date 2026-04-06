import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { EvaluationAttemptEntity } from '../entities/evaluation-attempt.entity';
import { EvaluationEntity } from '../entities/evaluation.entity';
import { EvaluationQuestionEntity } from '../entities/evaluation-question.entity';

@Injectable()
export class EvaluationsRepository {
  constructor(
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
    @InjectRepository(EvaluationQuestionEntity)
    private readonly questionsRepository: Repository<EvaluationQuestionEntity>,
    @InjectRepository(EvaluationAttemptEntity)
    private readonly attemptsRepository: Repository<EvaluationAttemptEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
  ) {}

  async findAllEvaluations(): Promise<EvaluationEntity[]> {
    return this.evaluationsRepository.find({
      where: { deletedAt: IsNull() },
      relations: {
        creator: true,
        course: true,
        questions: true,
        attempts: true,
      },
      order: {
        createdAt: 'DESC',
        questions: { position: 'ASC' },
      },
    });
  }

  async findEvaluationById(
    evaluationId: string,
  ): Promise<EvaluationEntity | null> {
    return this.evaluationsRepository.findOne({
      where: { id: evaluationId, deletedAt: IsNull() },
      relations: {
        creator: true,
        course: true,
        questions: true,
        attempts: true,
      },
    });
  }

  async findEvaluationBySlug(slug: string): Promise<EvaluationEntity | null> {
    return this.evaluationsRepository.findOne({
      where: { slug, deletedAt: IsNull() },
      relations: {
        creator: true,
        course: true,
        questions: true,
        attempts: true,
      },
    });
  }

  async saveEvaluation(
    evaluation: EvaluationEntity,
  ): Promise<EvaluationEntity> {
    return this.evaluationsRepository.save(evaluation);
  }

  async softDeleteEvaluation(evaluation: EvaluationEntity): Promise<void> {
    await this.evaluationsRepository.softRemove(evaluation);
  }

  async findQuestionById(
    questionId: string,
  ): Promise<EvaluationQuestionEntity | null> {
    return this.questionsRepository.findOne({
      where: { id: questionId },
      relations: { evaluation: true },
    });
  }

  async saveQuestion(
    question: EvaluationQuestionEntity,
  ): Promise<EvaluationQuestionEntity> {
    return this.questionsRepository.save(question);
  }

  async removeQuestion(question: EvaluationQuestionEntity): Promise<void> {
    await this.questionsRepository.remove(question);
  }

  async findAttemptById(
    attemptId: string,
  ): Promise<EvaluationAttemptEntity | null> {
    return this.attemptsRepository.findOne({
      where: { id: attemptId },
      relations: {
        evaluation: true,
        student: true,
        grader: true,
      },
    });
  }

  async saveAttempt(
    attempt: EvaluationAttemptEntity,
  ): Promise<EvaluationAttemptEntity> {
    return this.attemptsRepository.save(attempt);
  }

  async findAttemptsByEvaluationId(
    evaluationId: string,
  ): Promise<EvaluationAttemptEntity[]> {
    return this.attemptsRepository.find({
      where: { evaluation: { id: evaluationId } },
      relations: {
        evaluation: true,
        student: true,
        grader: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findAttemptsByStudentId(
    studentId: string,
  ): Promise<EvaluationAttemptEntity[]> {
    return this.attemptsRepository.find({
      where: { student: { id: studentId } },
      relations: {
        evaluation: true,
        student: true,
        grader: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async countAttemptsByStudent(
    evaluationId: string,
    studentId: string,
  ): Promise<number> {
    return this.attemptsRepository.count({
      where: {
        evaluation: { id: evaluationId },
        student: { id: studentId },
      },
    });
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
}
