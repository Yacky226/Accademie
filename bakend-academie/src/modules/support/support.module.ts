import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { SupportTicketEntity } from './entities/support-ticket.entity';
import { SupportRepository } from './repositories/support.repository';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicketEntity, UserEntity])],
  controllers: [SupportController],
  providers: [SupportRepository, SupportService],
  exports: [SupportRepository, SupportService],
})
export class SupportModule {}
