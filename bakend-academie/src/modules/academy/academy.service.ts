import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcademyAnnouncementResponseDto } from './dto/academy-announcement-response.dto';
import { AcademySettingResponseDto } from './dto/academy-setting-response.dto';
import { CreateAcademyAnnouncementDto } from './dto/create-academy-announcement.dto';
import { CreateAcademySettingDto } from './dto/create-academy-setting.dto';
import { UpdateAcademyAnnouncementDto } from './dto/update-academy-announcement.dto';
import { UpdateAcademySettingDto } from './dto/update-academy-setting.dto';
import { AcademyAnnouncementEntity } from './entities/academy-announcement.entity';
import { AcademySettingEntity } from './entities/academy-setting.entity';
import { AcademyRepository } from './repositories/academy.repository';

@Injectable()
export class AcademyService {
  constructor(private readonly academyRepository: AcademyRepository) {}

  async listAnnouncements(): Promise<AcademyAnnouncementResponseDto[]> {
    const announcements =
      await this.academyRepository.findPublishedAnnouncements();
    return announcements.map((announcement) =>
      this.toAnnouncementResponse(announcement),
    );
  }

  async listAllAnnouncements(): Promise<AcademyAnnouncementResponseDto[]> {
    const announcements = await this.academyRepository.findAllAnnouncements();
    return announcements.map((announcement) =>
      this.toAnnouncementResponse(announcement),
    );
  }

  async getAnnouncementById(
    id: string,
  ): Promise<AcademyAnnouncementResponseDto> {
    const announcement = await this.academyRepository.findAnnouncementById(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.toAnnouncementResponse(announcement);
  }

  async createAnnouncement(
    dto: CreateAcademyAnnouncementDto,
    creatorId: string,
  ): Promise<AcademyAnnouncementResponseDto> {
    const creator = await this.academyRepository.findUserById(creatorId);
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    const announcement = new AcademyAnnouncementEntity();
    announcement.title = dto.title;
    announcement.content = dto.content;
    announcement.isPublished = dto.isPublished ?? false;
    announcement.publishedAt = announcement.isPublished
      ? new Date()
      : undefined;
    announcement.createdBy = creator;

    const saved = await this.academyRepository.saveAnnouncement(announcement);
    return this.toAnnouncementResponse(saved);
  }

  async updateAnnouncement(
    id: string,
    dto: UpdateAcademyAnnouncementDto,
  ): Promise<AcademyAnnouncementResponseDto> {
    const announcement = await this.academyRepository.findAnnouncementById(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (dto.title !== undefined) {
      announcement.title = dto.title;
    }

    if (dto.content !== undefined) {
      announcement.content = dto.content;
    }

    if (dto.isPublished !== undefined) {
      const isPublishingNow = dto.isPublished && !announcement.isPublished;
      announcement.isPublished = dto.isPublished;
      announcement.publishedAt = isPublishingNow
        ? new Date()
        : dto.isPublished
          ? announcement.publishedAt
          : undefined;
    }

    const saved = await this.academyRepository.saveAnnouncement(announcement);
    return this.toAnnouncementResponse(saved);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const announcement = await this.academyRepository.findAnnouncementById(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.academyRepository.softDeleteAnnouncement(announcement);
  }

  async listPublicSettings(): Promise<AcademySettingResponseDto[]> {
    const settings = await this.academyRepository.findPublicSettings();
    return settings.map((setting) => this.toSettingResponse(setting));
  }

  async listAllSettings(): Promise<AcademySettingResponseDto[]> {
    const settings = await this.academyRepository.findAllSettings();
    return settings.map((setting) => this.toSettingResponse(setting));
  }

  async createSetting(
    dto: CreateAcademySettingDto,
  ): Promise<AcademySettingResponseDto> {
    const existing = await this.academyRepository.findSettingByKey(dto.key);
    if (existing) {
      throw new ConflictException('Setting key already exists');
    }

    const setting = new AcademySettingEntity();
    setting.key = dto.key;
    setting.value = dto.value;
    setting.description = dto.description;
    setting.isPublic = dto.isPublic ?? false;

    const saved = await this.academyRepository.saveSetting(setting);
    return this.toSettingResponse(saved);
  }

  async updateSetting(
    key: string,
    dto: UpdateAcademySettingDto,
  ): Promise<AcademySettingResponseDto> {
    const setting = await this.academyRepository.findSettingByKey(key);
    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    if (dto.value !== undefined) {
      setting.value = dto.value;
    }

    if (dto.description !== undefined) {
      setting.description = dto.description;
    }

    if (dto.isPublic !== undefined) {
      setting.isPublic = dto.isPublic;
    }

    const saved = await this.academyRepository.saveSetting(setting);
    return this.toSettingResponse(saved);
  }

  async deleteSetting(key: string): Promise<void> {
    const setting = await this.academyRepository.findSettingByKey(key);
    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    await this.academyRepository.softDeleteSetting(setting);
  }

  private toAnnouncementResponse(
    announcement: AcademyAnnouncementEntity,
  ): AcademyAnnouncementResponseDto {
    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      isPublished: announcement.isPublished,
      publishedAt: announcement.publishedAt,
      createdBy: announcement.createdBy
        ? {
            id: announcement.createdBy.id,
            firstName: announcement.createdBy.firstName,
            lastName: announcement.createdBy.lastName,
            email: announcement.createdBy.email,
          }
        : undefined,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }

  private toSettingResponse(
    setting: AcademySettingEntity,
  ): AcademySettingResponseDto {
    return {
      id: setting.id,
      key: setting.key,
      value: setting.value,
      description: setting.description,
      isPublic: setting.isPublic,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }
}
