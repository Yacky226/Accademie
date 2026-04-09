import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../integrations/mail';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ContactRequestResponseDto } from './dto/contact-request-response.dto';
import { ContactRequestEntity } from './entities/contact-request.entity';
import { ContactRepository } from './repositories/contact.repository';

function trimEmail(email: string) {
  return email.trim().toLowerCase();
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly mailService: MailService,
  ) {}

  async listRequests(): Promise<ContactRequestResponseDto[]> {
    const requests = await this.contactRepository.findAllRequests();
    return requests.map((request) => this.toResponse(request));
  }

  async createRequest(
    dto: CreateContactRequestDto,
  ): Promise<ContactRequestResponseDto> {
    const request = new ContactRequestEntity();
    request.fullName = dto.fullName.trim();
    request.email = trimEmail(dto.email);
    request.subject = dto.subject.trim();
    request.message = dto.message.trim();
    request.status = 'NEW';

    const savedRequest = await this.contactRepository.saveRequest(request);

    await this.notifyInbox(savedRequest);

    return this.toResponse(savedRequest);
  }

  private async notifyInbox(request: ContactRequestEntity) {
    const inboxEmail =
      process.env.CONTACT_INBOX_EMAIL?.trim() ||
      process.env.SMTP_FROM_EMAIL?.trim() ||
      process.env.SMTP_USER?.trim();

    if (!inboxEmail) {
      return;
    }

    try {
      await this.mailService.sendContactRequestNotification({
        fullName: request.fullName,
        message: request.message,
        replyTo: request.email,
        subject: request.subject,
        to: inboxEmail,
      });
    } catch (error) {
      this.logger.warn(
        `Contact request ${request.id} was saved but email delivery failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private toResponse(
    request: ContactRequestEntity,
  ): ContactRequestResponseDto {
    return {
      id: request.id,
      fullName: request.fullName,
      email: request.email,
      subject: request.subject,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}
