import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { AcademyController } from './academy.controller';
import { AcademyService } from './academy.service';
import { AcademyAnnouncementEntity } from './entities/academy-announcement.entity';
import { AcademySettingEntity } from './entities/academy-setting.entity';
import { AcademyRepository } from './repositories/academy.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			AcademyAnnouncementEntity,
			AcademySettingEntity,
			UserEntity,
		]),
	],
	controllers: [AcademyController],
	providers: [AcademyService, AcademyRepository],
	exports: [AcademyService, AcademyRepository],
})
export class AcademyModule {}

