import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ContactRequestEntity } from '../entities/contact-request.entity';

@Injectable()
export class ContactRepository {
  constructor(
    @InjectRepository(ContactRequestEntity)
    private readonly contactRequestsRepository: Repository<ContactRequestEntity>,
  ) {}

  async findAllRequests(): Promise<ContactRequestEntity[]> {
    return this.contactRequestsRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async saveRequest(
    request: ContactRequestEntity,
  ): Promise<ContactRequestEntity> {
    return this.contactRequestsRepository.save(request);
  }
}
