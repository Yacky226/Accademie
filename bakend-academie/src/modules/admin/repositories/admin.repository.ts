import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { UserStatus } from '../../../core/enums';
import { AcademyAnnouncementEntity } from '../../academy/entities/academy-announcement.entity';
import { CourseEntity } from '../../courses/entities/course.entity';
import { EvaluationEntity } from '../../evaluations/entities/evaluation.entity';
import { RoleEntity } from '../../users/entities/role.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly rolesRepository: Repository<RoleEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
    @InjectRepository(AcademyAnnouncementEntity)
    private readonly announcementsRepository: Repository<AcademyAnnouncementEntity>,
  ) {}

  async findPendingUsers(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      where: { status: UserStatus.PENDING, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  async saveUser(user: UserEntity): Promise<UserEntity> {
    return this.usersRepository.save(user);
  }

  async findRolesByNames(roleNames: string[]): Promise<RoleEntity[]> {
    const normalized = roleNames.map((role) => role.trim().toUpperCase());
    return this.rolesRepository.find({ where: { name: In(normalized) } });
  }

  async countUsersByStatus(status: UserStatus): Promise<number> {
    return this.usersRepository.count({ where: { status, deletedAt: IsNull() } });
  }

  async countCoursesDraft(): Promise<number> {
    return this.coursesRepository.count({
      where: { isPublished: false, deletedAt: IsNull() },
    });
  }

  async countEvaluationsDraft(): Promise<number> {
    return this.evaluationsRepository.count({
      where: { isPublished: false, deletedAt: IsNull() },
    });
  }

  async countAnnouncementsDraft(): Promise<number> {
    return this.announcementsRepository.count({
      where: { isPublished: false, deletedAt: IsNull() },
    });
  }
}
