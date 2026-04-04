import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';

export interface CreateAuditLogInput {
  action: string;
  resource: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogsRepository: Repository<AuditLogEntity>,
  ) {}

  async createLog(input: CreateAuditLogInput): Promise<void> {
    const log = this.auditLogsRepository.create(input);
    await this.auditLogsRepository.save(log);
  }

  async listLogs(limit = 100): Promise<AuditLogEntity[]> {
    return this.auditLogsRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
