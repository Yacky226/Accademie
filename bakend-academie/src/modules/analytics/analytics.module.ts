import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarEventEntity } from '../calendar/entities/calendar-event.entity';
import { EnrollmentEntity } from '../courses/entities/enrollment.entity';
import { CourseEntity } from '../courses/entities/course.entity';
import { EvaluationAttemptEntity } from '../evaluations/entities/evaluation-attempt.entity';
import { EvaluationEntity } from '../evaluations/entities/evaluation.entity';
import { GradeEntity } from '../grades/entities/grade.entity';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { ProblemEntity } from '../problems/entities/problem.entity';
import { StudentProgramEntity } from '../programs/entities/student-program.entity';
import { SubmissionEntity } from '../submissions/entities/submission.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CourseEntity,
      EnrollmentEntity,
      StudentProgramEntity,
      ProblemEntity,
      EvaluationEntity,
      EvaluationAttemptEntity,
      SubmissionEntity,
      GradeEntity,
      CalendarEventEntity,
      NotificationEntity,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}
