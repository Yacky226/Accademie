import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ADMIN_PERMISSIONS } from '../../core/constants';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { AdminService } from './admin.service';
import { AdminOverviewResponseDto } from './dto/admin-overview-response.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { AssignAdminUserRolesDto } from './dto/assign-admin-user-roles.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-user-status.dto';

@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Permissions(ADMIN_PERMISSIONS.ADMIN_OVERVIEW_READ)
  @Get('overview')
  async getOverview(): Promise<AdminOverviewResponseDto> {
    return this.adminService.getOverview();
  }

  @Permissions(ADMIN_PERMISSIONS.ADMIN_USERS_REVIEW)
  @Get('users/pending')
  async listPendingUsers(): Promise<AdminUserResponseDto[]> {
    return this.adminService.listPendingUsers();
  }

  @Permissions(ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE)
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserStatusDto,
  ): Promise<AdminUserResponseDto> {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Permissions(ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE)
  @Patch('users/:id/roles')
  async assignUserRoles(
    @Param('id') id: string,
    @Body() dto: AssignAdminUserRolesDto,
  ): Promise<AdminUserResponseDto> {
    return this.adminService.assignUserRoles(id, dto);
  }
}
