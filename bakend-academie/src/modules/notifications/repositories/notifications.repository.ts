import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAllNotifications(): Promise<NotificationEntity[]> {
    return this.notificationsRepository.find({
      where: { deletedAt: IsNull() },
      relations: { recipient: true, sender: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findNotificationById(
    notificationId: string,
  ): Promise<NotificationEntity | null> {
    return this.notificationsRepository.findOne({
      where: { id: notificationId, deletedAt: IsNull() },
      relations: { recipient: true, sender: true },
    });
  }

  async findNotificationsByRecipientId(
    recipientId: string,
  ): Promise<NotificationEntity[]> {
    return this.notificationsRepository.find({
      where: { recipient: { id: recipientId }, deletedAt: IsNull() },
      relations: { recipient: true, sender: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findProgramStepReminder(
    recipientId: string,
    stepId: string,
  ): Promise<NotificationEntity | null> {
    return this.notificationsRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.recipient', 'recipient')
      .leftJoinAndSelect('notification.sender', 'sender')
      .where('notification.deletedAt IS NULL')
      .andWhere('recipient.id = :recipientId', { recipientId })
      .andWhere("notification.metadata ->> 'source' = :source", {
        source: 'program-step',
      })
      .andWhere("notification.metadata ->> 'stepId' = :stepId", { stepId })
      .orderBy('notification.createdAt', 'DESC')
      .getOne();
  }

  async saveNotification(
    notification: NotificationEntity,
  ): Promise<NotificationEntity> {
    return this.notificationsRepository.save(notification);
  }

  async softDeleteNotification(
    notification: NotificationEntity,
  ): Promise<void> {
    await this.notificationsRepository.softRemove(notification);
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }
}
