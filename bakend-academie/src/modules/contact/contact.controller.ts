import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '../../core/decorators/roles.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { UserRole } from '../../core/enums';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ContactRequestResponseDto } from './dto/contact-request-response.dto';
import { ContactService } from './contact.service';

@Controller('contact-requests')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  async createRequest(
    @Body() dto: CreateContactRequestDto,
  ): Promise<ContactRequestResponseDto> {
    return this.contactService.createRequest(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  async listRequests(): Promise<ContactRequestResponseDto[]> {
    return this.contactService.listRequests();
  }
}
