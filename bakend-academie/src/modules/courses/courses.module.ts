import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../integrations/storage';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserEntity } from '../users/entities/user.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseModuleEntity } from './entities/course-module.entity';
import { CourseEntity } from './entities/course.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { LessonEntity } from './entities/lesson.entity';
import { CoursesRepository } from './repositories/courses.repository';

@Module({
  imports: [
    NotificationsModule,
    StorageModule,
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseModuleEntity,
      LessonEntity,
      EnrollmentEntity,
      UserEntity,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository],
  exports: [CoursesService, CoursesRepository],
})
export class CoursesModule {}
