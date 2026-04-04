import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
	imports: [TypeOrmModule.forFeature([NotificationEntity, UserEntity])],
	controllers: [NotificationsController],
	providers: [NotificationsService, NotificationsRepository],
	exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}

