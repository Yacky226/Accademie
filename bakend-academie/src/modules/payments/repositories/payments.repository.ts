import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { PaymentEntity } from '../entities/payment.entity';

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepository: Repository<PaymentEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
  ) {}

  async findAllPayments(): Promise<PaymentEntity[]> {
    return this.paymentsRepository.find({
      where: { deletedAt: IsNull() },
      relations: { user: true, course: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPaymentsByUserId(userId: string): Promise<PaymentEntity[]> {
    return this.paymentsRepository.find({
      where: { user: { id: userId }, deletedAt: IsNull() },
      relations: { user: true, course: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPaymentById(id: string): Promise<PaymentEntity | null> {
    return this.paymentsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { user: true, course: true },
    });
  }

  async findPaymentByReference(reference: string): Promise<PaymentEntity | null> {
    return this.paymentsRepository.findOne({
      where: { reference, deletedAt: IsNull() },
      relations: { user: true, course: true },
    });
  }

  async findPaymentByProviderTransactionId(
    providerTransactionId: string,
  ): Promise<PaymentEntity | null> {
    return this.paymentsRepository.findOne({
      where: { providerTransactionId, deletedAt: IsNull() },
      relations: { user: true, course: true },
    });
  }

  async findPaymentByMetadataValue(key: string, value: string): Promise<PaymentEntity | null> {
    const allowedKeys = new Set([
      'stripeCheckoutSessionId',
      'stripePaymentIntentId',
      'stripeChargeId',
      'stripeInvoiceId',
      'stripeSubscriptionId',
    ]);

    if (!allowedKeys.has(key)) {
      return null;
    }

    return this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.course', 'course')
      .where('payment.deletedAt IS NULL')
      .andWhere(`payment.metadata ->> '${key}' = :value`, { value })
      .orderBy('payment.createdAt', 'DESC')
      .getOne();
  }

  async savePayment(payment: PaymentEntity): Promise<PaymentEntity> {
    return this.paymentsRepository.save(payment);
  }

  async softDeletePayment(payment: PaymentEntity): Promise<void> {
    await this.paymentsRepository.softRemove(payment);
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id: userId, deletedAt: IsNull() } });
  }

  async findCourseById(courseId: string): Promise<CourseEntity | null> {
    return this.coursesRepository.findOne({ where: { id: courseId, deletedAt: IsNull() } });
  }
}
