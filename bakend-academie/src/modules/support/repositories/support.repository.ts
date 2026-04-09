import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { SupportTicketEntity } from '../entities/support-ticket.entity';

@Injectable()
export class SupportRepository {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly supportTicketsRepository: Repository<SupportTicketEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findAllTickets(): Promise<SupportTicketEntity[]> {
    return this.supportTicketsRepository.find({
      where: { deletedAt: IsNull() },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findTicketById(id: string): Promise<SupportTicketEntity | null> {
    return this.supportTicketsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { user: true },
    });
  }

  async findTicketsByUserId(userId: string): Promise<SupportTicketEntity[]> {
    return this.supportTicketsRepository.find({
      where: {
        deletedAt: IsNull(),
        user: { id: userId },
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async saveTicket(ticket: SupportTicketEntity): Promise<SupportTicketEntity> {
    return this.supportTicketsRepository.save(ticket);
  }
}
