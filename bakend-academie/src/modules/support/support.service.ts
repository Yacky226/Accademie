import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../core/enums';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportTicketResponseDto } from './dto/support-ticket-response.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';
import { SupportTicketEntity } from './entities/support-ticket.entity';
import { SupportRepository } from './repositories/support.repository';

@Injectable()
export class SupportService {
  constructor(private readonly supportRepository: SupportRepository) {}

  async listMyTickets(userId: string): Promise<SupportTicketResponseDto[]> {
    const user = await this.supportRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tickets = await this.supportRepository.findTicketsByUserId(userId);
    return tickets.map((ticket) => this.toResponse(ticket));
  }

  async listTickets(): Promise<SupportTicketResponseDto[]> {
    const tickets = await this.supportRepository.findAllTickets();
    return tickets.map((ticket) => this.toResponse(ticket));
  }

  async createMyTicket(
    userId: string,
    dto: CreateSupportTicketDto,
  ): Promise<SupportTicketResponseDto> {
    const user = await this.supportRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ticket = new SupportTicketEntity();
    ticket.subject = dto.subject.trim();
    ticket.category = dto.category.trim();
    ticket.description = dto.description.trim();
    ticket.status = 'OPEN';
    ticket.user = user;

    const savedTicket = await this.supportRepository.saveTicket(ticket);
    return this.toResponse(savedTicket);
  }

  async updateTicketStatus(
    id: string,
    dto: UpdateSupportTicketStatusDto,
    userId: string,
    roles: string[],
  ): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportRepository.findTicketById(id);
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const hasElevatedRole =
      roles.includes(UserRole.ADMIN) || roles.includes(UserRole.TEACHER);
    const isOwner = ticket.user.id === userId;

    if (!hasElevatedRole && !isOwner) {
      throw new ForbiddenException(
        'You are not allowed to update this support ticket',
      );
    }

    ticket.status = dto.status;
    if (dto.resolution !== undefined) {
      ticket.resolution = dto.resolution.trim() || undefined;
    }

    const savedTicket = await this.supportRepository.saveTicket(ticket);
    return this.toResponse(savedTicket);
  }

  private toResponse(ticket: SupportTicketEntity): SupportTicketResponseDto {
    return {
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      description: ticket.description,
      resolution: ticket.resolution,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      user: {
        id: ticket.user.id,
        firstName: ticket.user.firstName,
        lastName: ticket.user.lastName,
        email: ticket.user.email,
      },
    };
  }
}
