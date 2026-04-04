import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { AcademyAnnouncementEntity } from '../entities/academy-announcement.entity';
import { AcademySettingEntity } from '../entities/academy-setting.entity';

@Injectable()
export class AcademyRepository {
  constructor(
    @InjectRepository(AcademyAnnouncementEntity)
    private readonly announcementsRepository: Repository<AcademyAnnouncementEntity>,
    @InjectRepository(AcademySettingEntity)
    private readonly settingsRepository: Repository<AcademySettingEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAllAnnouncements(): Promise<AcademyAnnouncementEntity[]> {
    return this.announcementsRepository.find({
      where: { deletedAt: IsNull() },
      relations: { createdBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPublishedAnnouncements(): Promise<AcademyAnnouncementEntity[]> {
    return this.announcementsRepository.find({
      where: { deletedAt: IsNull(), isPublished: true },
      relations: { createdBy: true },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findAnnouncementById(id: string): Promise<AcademyAnnouncementEntity | null> {
    return this.announcementsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { createdBy: true },
    });
  }

  async saveAnnouncement(
    announcement: AcademyAnnouncementEntity,
  ): Promise<AcademyAnnouncementEntity> {
    return this.announcementsRepository.save(announcement);
  }

  async softDeleteAnnouncement(announcement: AcademyAnnouncementEntity): Promise<void> {
    await this.announcementsRepository.softRemove(announcement);
  }

  async findAllSettings(): Promise<AcademySettingEntity[]> {
    return this.settingsRepository.find({
      where: { deletedAt: IsNull() },
      order: { key: 'ASC' },
    });
  }

  async findPublicSettings(): Promise<AcademySettingEntity[]> {
    return this.settingsRepository.find({
      where: { deletedAt: IsNull(), isPublic: true },
      order: { key: 'ASC' },
    });
  }

  async findSettingByKey(key: string): Promise<AcademySettingEntity | null> {
    return this.settingsRepository.findOne({
      where: { key, deletedAt: IsNull() },
    });
  }

  async saveSetting(setting: AcademySettingEntity): Promise<AcademySettingEntity> {
    return this.settingsRepository.save(setting);
  }

  async softDeleteSetting(setting: AcademySettingEntity): Promise<void> {
    await this.settingsRepository.softRemove(setting);
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }
}
