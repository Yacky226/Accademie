import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../core/enums';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsRepository } from './repositories/notifications.repository';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async getNotifications(): Promise<NotificationResponseDto[]> {
    const notifications =
      await this.notificationsRepository.findAllNotifications();
    return notifications.map((notification) =>
      this.mapToResponseDto(notification),
    );
  }

  async getMyNotifications(userId: string): Promise<NotificationResponseDto[]> {
    const notifications =
      await this.notificationsRepository.findNotificationsByRecipientId(userId);
    return notifications.map((notification) =>
      this.mapToResponseDto(notification),
    );
  }

  async getNotificationById(
    notificationId: string,
    userId: string,
    roles: string[],
  ): Promise<NotificationResponseDto> {
    const notification =
      await this.notificationsRepository.findNotificationById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const canAccess =
      this.hasElevatedRole(roles) ||
      notification.recipient.id === userId ||
      notification.sender?.id === userId;

    if (!canAccess) {
      throw new ForbiddenException('Access denied to this notification');
    }

    return this.mapToResponseDto(notification);
  }

  async createNotification(
    createDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const recipient = await this.notificationsRepository.findUserById(
      createDto.recipientId,
    );
    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    let sender: UserEntity | undefined;
    if (createDto.senderId) {
      const resolvedSender = await this.notificationsRepository.findUserById(
        createDto.senderId,
      );
      if (!resolvedSender) {
        throw new NotFoundException('Sender user not found');
      }
      sender = resolvedSender;
    }

    const notification = new NotificationEntity();
    notification.title = createDto.title;
    notification.message = createDto.message;
    notification.type = createDto.type ?? 'INFO';
    notification.channel = createDto.channel ?? notification.channel;
    notification.metadata = createDto.metadata;
    notification.recipient = recipient;
    notification.sender = sender;

    const saved =
      await this.notificationsRepository.saveNotification(notification);
    const hydrated = await this.notificationsRepository.findNotificationById(
      saved.id,
    );

    return this.mapToResponseDto(hydrated ?? saved);
  }

  async updateNotification(
    notificationId: string,
    updateDto: UpdateNotificationDto,
    userId: string,
    roles: string[],
  ): Promise<NotificationResponseDto> {
    const notification =
      await this.notificationsRepository.findNotificationById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const canEdit =
      this.hasElevatedRole(roles) || notification.recipient.id === userId;

    if (!canEdit) {
      throw new ForbiddenException(
        'You are not allowed to update this notification',
      );
    }

    if (updateDto.title !== undefined) {
      notification.title = updateDto.title;
    }
    if (updateDto.message !== undefined) {
      notification.message = updateDto.message;
    }
    if (updateDto.type !== undefined) {
      notification.type = updateDto.type;
    }
    if (updateDto.channel !== undefined) {
      notification.channel = updateDto.channel;
    }
    if (updateDto.metadata !== undefined) {
      notification.metadata = updateDto.metadata;
    }
    if (updateDto.isRead !== undefined) {
      notification.isRead = updateDto.isRead;
      notification.readAt = updateDto.isRead ? new Date() : undefined;
    }

    const updated =
      await this.notificationsRepository.saveNotification(notification);
    const hydrated = await this.notificationsRepository.findNotificationById(
      updated.id,
    );

    return this.mapToResponseDto(hydrated ?? updated);
  }

  async markAsRead(
    notificationId: string,
    userId: string,
    roles: string[],
  ): Promise<NotificationResponseDto> {
    return this.updateNotification(
      notificationId,
      { isRead: true },
      userId,
      roles,
    );
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
    roles: string[],
  ): Promise<void> {
    const notification =
      await this.notificationsRepository.findNotificationById(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const canDelete =
      this.hasElevatedRole(roles) || notification.recipient.id === userId;

    if (!canDelete) {
      throw new ForbiddenException(
        'You are not allowed to delete this notification',
      );
    }

    await this.notificationsRepository.softDeleteNotification(notification);
  }

  private mapToResponseDto(
    notification: NotificationEntity,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      channel: notification.channel,
      isRead: notification.isRead,
      readAt: notification.readAt,
      metadata: notification.metadata,
      recipient: {
        id: notification.recipient.id,
        firstName: notification.recipient.firstName,
        lastName: notification.recipient.lastName,
        email: notification.recipient.email,
      },
      sender: notification.sender
        ? {
            id: notification.sender.id,
            firstName: notification.sender.firstName,
            lastName: notification.sender.lastName,
            email: notification.sender.email,
          }
        : undefined,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  private hasElevatedRole(roles: string[]): boolean {
    return roles.includes(UserRole.ADMIN) || roles.includes(UserRole.TEACHER);
  }
}
