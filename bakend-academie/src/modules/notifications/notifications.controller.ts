import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { NOTIFICATION_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_READ)
  async getNotifications(): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getNotifications();
  }

  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_READ)
  @Get('me')
  async getMyNotifications(
    @CurrentUser('sub') userId: string,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getMyNotifications(userId);
  }

  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_READ)
  @Get(':id')
  async getNotificationById(
    @Param('id') notificationId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.getNotificationById(notificationId, userId, roles ?? []);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_CREATE)
  async createNotification(
    @Body() createDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.createNotification(createDto);
  }

  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_UPDATE)
  @Patch(':id')
  async updateNotification(
    @Param('id') notificationId: string,
    @Body() updateDto: UpdateNotificationDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.updateNotification(notificationId, updateDto, userId, roles ?? []);
  }

  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_UPDATE)
  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(notificationId, userId, roles ?? []);
  }

  @Permissions(NOTIFICATION_PERMISSIONS.NOTIFICATIONS_DELETE)
  @Delete(':id')
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('roles') roles: string[],
  ): Promise<void> {
    return this.notificationsService.deleteNotification(notificationId, userId, roles ?? []);
  }
}
