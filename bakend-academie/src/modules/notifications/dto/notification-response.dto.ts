import { NotificationChannel } from '../../../core/enums';

export class NotificationResponseDto {
  id!: string;
  title!: string;
  message!: string;
  type!: string;
  channel!: NotificationChannel;
  isRead!: boolean;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  recipient!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}
