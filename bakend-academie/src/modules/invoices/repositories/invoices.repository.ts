import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { InvoiceFiscalEventEntity } from '../entities/invoice-fiscal-event.entity';
import { InvoiceEntity } from '../entities/invoice.entity';

@Injectable()
export class InvoicesRepository {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoicesRepository: Repository<InvoiceEntity>,
    @InjectRepository(InvoiceFiscalEventEntity)
    private readonly invoiceFiscalEventsRepository: Repository<InvoiceFiscalEventEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepository: Repository<PaymentEntity>,
  ) {}

  async findAllInvoices(): Promise<InvoiceEntity[]> {
    return this.invoicesRepository.find({
      where: { deletedAt: IsNull() },
      relations: { user: true, payment: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findInvoicesByUserId(userId: string): Promise<InvoiceEntity[]> {
    return this.invoicesRepository.find({
      where: { user: { id: userId }, deletedAt: IsNull() },
      relations: { user: true, payment: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findInvoiceById(id: string): Promise<InvoiceEntity | null> {
    return this.invoicesRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { user: true, payment: true },
    });
  }

  async findInvoiceByPaymentId(paymentId: string): Promise<InvoiceEntity | null> {
    return this.invoicesRepository.findOne({
      where: { payment: { id: paymentId }, deletedAt: IsNull() },
      relations: { user: true, payment: true },
    });
  }

  async saveInvoice(invoice: InvoiceEntity): Promise<InvoiceEntity> {
    return this.invoicesRepository.save(invoice);
  }

  async saveFiscalEvent(event: InvoiceFiscalEventEntity): Promise<InvoiceFiscalEventEntity> {
    return this.invoiceFiscalEventsRepository.save(event);
  }

  async listFiscalEventsByInvoiceId(invoiceId: string): Promise<InvoiceFiscalEventEntity[]> {
    return this.invoiceFiscalEventsRepository.find({
      where: { invoice: { id: invoiceId } },
      order: { createdAt: 'ASC' },
    });
  }

  async listInvoicesForAccounting(from?: Date, to?: Date): Promise<InvoiceEntity[]> {
    const queryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.user', 'user')
      .leftJoinAndSelect('invoice.payment', 'payment')
      .where('invoice.deletedAt IS NULL')
      .andWhere('invoice.status IN (:...statuses)', { statuses: ['ISSUED', 'PAID'] })
      .orderBy('invoice.issuedAt', 'ASC')
      .addOrderBy('invoice.createdAt', 'ASC');

    if (from) {
      queryBuilder.andWhere('COALESCE(invoice.issuedAt, invoice.createdAt) >= :from', { from });
    }
    if (to) {
      queryBuilder.andWhere('COALESCE(invoice.issuedAt, invoice.createdAt) <= :to', { to });
    }

    return queryBuilder.getMany();
  }

  async countInvoicesByPrefix(prefix: string): Promise<number> {
    return this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.number LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
  }

  async softDeleteInvoice(invoice: InvoiceEntity): Promise<void> {
    await this.invoicesRepository.softRemove(invoice);
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id: userId, deletedAt: IsNull() } });
  }

  async findPaymentById(paymentId: string): Promise<PaymentEntity | null> {
    return this.paymentsRepository.findOne({
      where: { id: paymentId, deletedAt: IsNull() },
      relations: { user: true },
    });
  }
}
