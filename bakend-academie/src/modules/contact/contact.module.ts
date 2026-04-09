import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../../integrations/mail';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactRequestEntity } from './entities/contact-request.entity';
import { ContactRepository } from './repositories/contact.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ContactRequestEntity]), MailModule],
  controllers: [ContactController],
  providers: [ContactRepository, ContactService],
  exports: [ContactRepository, ContactService],
})
export class ContactModule {}
