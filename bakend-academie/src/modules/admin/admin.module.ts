import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademyAnnouncementEntity } from '../academy/entities/academy-announcement.entity';
import { CourseEntity } from '../courses/entities/course.entity';
import { EvaluationEntity } from '../evaluations/entities/evaluation.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './repositories/admin.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      CourseEntity,
      EvaluationEntity,
      AcademyAnnouncementEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService, AdminRepository],
})
export class AdminModule {}
