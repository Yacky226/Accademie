import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from '../courses/courses.module';
import { CourseEntity } from '../courses/entities/course.entity';
import { GradesModule } from '../grades/grades.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserEntity } from '../users/entities/user.entity';
import { EvaluationAttemptEntity } from './entities/evaluation-attempt.entity';
import { EvaluationEntity } from './entities/evaluation.entity';
import { EvaluationQuestionEntity } from './entities/evaluation-question.entity';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsRepository } from './repositories/evaluations.repository';

@Module({
  imports: [
    CoursesModule,
    GradesModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      EvaluationEntity,
      EvaluationQuestionEntity,
      EvaluationAttemptEntity,
      UserEntity,
      CourseEntity,
    ]),
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService, EvaluationsRepository],
  exports: [EvaluationsService, EvaluationsRepository],
})
export class EvaluationsModule {}
