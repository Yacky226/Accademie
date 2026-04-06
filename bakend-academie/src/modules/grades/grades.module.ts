import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../courses/entities/course.entity';
import { EvaluationAttemptEntity } from '../evaluations/entities/evaluation-attempt.entity';
import { UserEntity } from '../users/entities/user.entity';
import { GradesController } from './grades.controller';
import { GradeEntity } from './entities/grade.entity';
import { GradesRepository } from './repositories/grades.repository';
import { GradesService } from './grades.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GradeEntity,
      UserEntity,
      CourseEntity,
      EvaluationAttemptEntity,
    ]),
  ],
  controllers: [GradesController],
  providers: [GradesService, GradesRepository],
  exports: [GradesService, GradesRepository],
})
export class GradesModule {}
