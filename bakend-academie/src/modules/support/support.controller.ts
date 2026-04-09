import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportTicketResponseDto } from './dto/support-ticket-response.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';
import { SupportService } from './support.service';

@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('me')
  async listMyTickets(
    @CurrentUser('sub') userId: string,
  ): Promise<SupportTicketResponseDto[]> {
    return this.supportService.listMyTickets(userId);
  }

  @Post('me')
  async createMyTicket(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSupportTicketDto,
  ): Promise<SupportTicketResponseDto> {
    return this.supportService.createMyTicket(userId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  async listTickets(): Promise<SupportTicketResponseDto[]> {
    return this.supportService.listTickets();
  }

  @Patch(':id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketStatusDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<SupportTicketResponseDto> {
    return this.supportService.updateTicketStatus(id, dto, userId, roles);
  }
}
