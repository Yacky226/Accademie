import { Controller, Get, Query } from '@nestjs/common';
import { ADMIN_PERMISSIONS } from '../../core/constants';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditService } from './audit.service';

@Roles(UserRole.ADMIN)
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Permissions(ADMIN_PERMISSIONS.ADMIN_AUDIT_READ)
  @Get()
  async listLogs(@Query('limit') limit?: string): Promise<AuditLogEntity[]> {
    const parsedLimit = limit ? Number(limit) : 100;
    return this.auditService.listLogs(parsedLimit);
  }
}
