import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationChannel } from '../../../core/enums';

export class CreateNotificationDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  type?: string;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsString()
  recipientId!: string;

  @IsOptional()
  @IsString()
  senderId?: string;
}
