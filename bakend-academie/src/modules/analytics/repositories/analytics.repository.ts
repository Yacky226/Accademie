import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, IsNull, Repository } from 'typeorm';
import { EnrollmentStatus, UserStatus } from '../../../core/enums';
import { CalendarEventEntity } from '../../calendar/entities/calendar-event.entity';
import { EnrollmentEntity } from '../../courses/entities/enrollment.entity';
import { CourseEntity } from '../../courses/entities/course.entity';
import { EvaluationAttemptEntity } from '../../evaluations/entities/evaluation-attempt.entity';
import { EvaluationEntity } from '../../evaluations/entities/evaluation.entity';
import { GradeEntity } from '../../grades/entities/grade.entity';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { ProblemEntity } from '../../problems/entities/problem.entity';
import { StudentProgramEntity } from '../../programs/entities/student-program.entity';
import { SubmissionEntity } from '../../submissions/entities/submission.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentsRepository: Repository<EnrollmentEntity>,
    @InjectRepository(StudentProgramEntity)
    private readonly programsRepository: Repository<StudentProgramEntity>,
    @InjectRepository(ProblemEntity)
    private readonly problemsRepository: Repository<ProblemEntity>,
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
    @InjectRepository(EvaluationAttemptEntity)
    private readonly attemptsRepository: Repository<EvaluationAttemptEntity>,
    @InjectRepository(SubmissionEntity)
    private readonly submissionsRepository: Repository<SubmissionEntity>,
    @InjectRepository(GradeEntity)
    private readonly gradesRepository: Repository<GradeEntity>,
    @InjectRepository(CalendarEventEntity)
    private readonly calendarEventsRepository: Repository<CalendarEventEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
  ) {}

  async countUsersTotal(): Promise<number> {
    return this.usersRepository.count({ where: { deletedAt: IsNull() } });
  }

  async countUsersActive(): Promise<number> {
    return this.usersRepository.count({
      where: { status: UserStatus.ACTIVE, deletedAt: IsNull() },
    });
  }

  async countCoursesTotal(): Promise<number> {
    return this.coursesRepository.count({ where: { deletedAt: IsNull() } });
  }

  async countCoursesPublished(): Promise<number> {
    return this.coursesRepository.count({
      where: { isPublished: true, deletedAt: IsNull() },
    });
  }

  async countEnrollmentsTotal(): Promise<number> {
    return this.enrollmentsRepository.count({
      where: { status: EnrollmentStatus.ACTIVE },
    });
  }

  async countProgramsTotal(): Promise<number> {
    return this.programsRepository.count();
  }

  async countProblemsTotal(): Promise<number> {
    return this.problemsRepository.count({ where: { deletedAt: IsNull() } });
  }

  async countEvaluationsTotal(): Promise<number> {
    return this.evaluationsRepository.count({ where: { deletedAt: IsNull() } });
  }

  async countSubmissionsTotal(): Promise<number> {
    return this.submissionsRepository.count();
  }

  async countGradesTotal(): Promise<number> {
    return this.gradesRepository.count({ where: { deletedAt: IsNull() } });
  }

  async countCalendarEventsTotal(): Promise<number> {
    return this.calendarEventsRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  async countNotificationsTotal(): Promise<number> {
    return this.notificationsRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  async countNewUsersSince(since: Date): Promise<number> {
    return this.usersRepository.count({
      where: { createdAt: MoreThanOrEqual(since), deletedAt: IsNull() },
    });
  }

  async countNewEnrollmentsSince(since: Date): Promise<number> {
    return this.enrollmentsRepository.count({
      where: { createdAt: MoreThanOrEqual(since) },
    });
  }

  async countSubmissionsSince(since: Date): Promise<number> {
    return this.submissionsRepository.count({
      where: { createdAt: MoreThanOrEqual(since) },
    });
  }

  async countEvaluationAttemptsSince(since: Date): Promise<number> {
    return this.attemptsRepository.count({
      where: { createdAt: MoreThanOrEqual(since) },
    });
  }

  async countNotificationsSince(since: Date): Promise<number> {
    return this.notificationsRepository.count({
      where: { createdAt: MoreThanOrEqual(since), deletedAt: IsNull() },
    });
  }
}
