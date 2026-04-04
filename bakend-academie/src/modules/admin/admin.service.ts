import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '../../core/enums';
import { AdminOverviewResponseDto } from './dto/admin-overview-response.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { AssignAdminUserRolesDto } from './dto/assign-admin-user-roles.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-user-status.dto';
import { AdminRepository } from './repositories/admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async getOverview(): Promise<AdminOverviewResponseDto> {
    const [
      usersPendingApproval,
      usersSuspended,
      usersInactive,
      coursesDraft,
      evaluationsDraft,
      announcementsDraft,
    ] = await Promise.all([
      this.adminRepository.countUsersByStatus(UserStatus.PENDING),
      this.adminRepository.countUsersByStatus(UserStatus.SUSPENDED),
      this.adminRepository.countUsersByStatus(UserStatus.INACTIVE),
      this.adminRepository.countCoursesDraft(),
      this.adminRepository.countEvaluationsDraft(),
      this.adminRepository.countAnnouncementsDraft(),
    ]);

    return {
      usersPendingApproval,
      usersSuspended,
      usersInactive,
      coursesDraft,
      evaluationsDraft,
      announcementsDraft,
    };
  }

  async listPendingUsers(): Promise<AdminUserResponseDto[]> {
    const users = await this.adminRepository.findPendingUsers();
    return users.map((user) => this.toUserResponse(user));
  }

  async updateUserStatus(
    userId: string,
    dto: UpdateAdminUserStatusDto,
  ): Promise<AdminUserResponseDto> {
    const user = await this.adminRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = dto.status;
    const saved = await this.adminRepository.saveUser(user);
    return this.toUserResponse(saved);
  }

  async assignUserRoles(
    userId: string,
    dto: AssignAdminUserRolesDto,
  ): Promise<AdminUserResponseDto> {
    const user = await this.adminRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = await this.adminRepository.findRolesByNames(dto.roleNames);
    if (roles.length !== dto.roleNames.length) {
      throw new ConflictException('One or more roles are invalid');
    }

    user.roles = roles;
    const saved = await this.adminRepository.saveUser(user);
    return this.toUserResponse(saved);
  }

  private toUserResponse(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    roles?: Array<{ name: string }>;
    createdAt: Date;
  }): AdminUserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      roles: (user.roles ?? []).map((role) => role.name),
      createdAt: user.createdAt,
    };
  }
}
