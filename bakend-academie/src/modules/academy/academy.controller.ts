import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ACADEMY_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { AcademyService } from './academy.service';
import { AcademyAnnouncementResponseDto } from './dto/academy-announcement-response.dto';
import { AcademySettingResponseDto } from './dto/academy-setting-response.dto';
import { CreateAcademyAnnouncementDto } from './dto/create-academy-announcement.dto';
import { CreateAcademySettingDto } from './dto/create-academy-setting.dto';
import { UpdateAcademyAnnouncementDto } from './dto/update-academy-announcement.dto';
import { UpdateAcademySettingDto } from './dto/update-academy-setting.dto';

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Public()
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_ANNOUNCEMENTS_READ)
  @Get('announcements')
  async listAnnouncements(): Promise<AcademyAnnouncementResponseDto[]> {
    return this.academyService.listAnnouncements();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_ANNOUNCEMENTS_READ)
  @Get('announcements/all')
  async listAllAnnouncements(): Promise<AcademyAnnouncementResponseDto[]> {
    return this.academyService.listAllAnnouncements();
  }

  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_ANNOUNCEMENTS_READ)
  @Get('announcements/:id')
  async getAnnouncementById(
    @Param('id') id: string,
  ): Promise<AcademyAnnouncementResponseDto> {
    return this.academyService.getAnnouncementById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_ANNOUNCEMENTS_MANAGE)
  @Post('announcements')
  async createAnnouncement(
    @Body() dto: CreateAcademyAnnouncementDto,
    @CurrentUser('sub') creatorId: string,
  ): Promise<AcademyAnnouncementResponseDto> {
    return this.academyService.createAnnouncement(dto, creatorId);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_ANNOUNCEMENTS_MANAGE)
  @Patch('announcements/:id')
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAcademyAnnouncementDto,
  ): Promise<AcademyAnnouncementResponseDto> {
    return this.academyService.updateAnnouncement(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_ANNOUNCEMENTS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('announcements/:id')
  async deleteAnnouncement(@Param('id') id: string): Promise<void> {
    await this.academyService.deleteAnnouncement(id);
  }

  @Public()
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_SETTINGS_READ_PUBLIC)
  @Get('settings/public')
  async listPublicSettings(): Promise<AcademySettingResponseDto[]> {
    return this.academyService.listPublicSettings();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_SETTINGS_READ)
  @Get('settings')
  async listAllSettings(): Promise<AcademySettingResponseDto[]> {
    return this.academyService.listAllSettings();
  }

  @Roles(UserRole.ADMIN)
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_SETTINGS_MANAGE)
  @Post('settings')
  async createSetting(@Body() dto: CreateAcademySettingDto): Promise<AcademySettingResponseDto> {
    return this.academyService.createSetting(dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_SETTINGS_MANAGE)
  @Patch('settings/:key')
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateAcademySettingDto,
  ): Promise<AcademySettingResponseDto> {
    return this.academyService.updateSetting(key, dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(ACADEMY_PERMISSIONS.ACADEMY_SETTINGS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('settings/:key')
  async deleteSetting(@Param('key') key: string): Promise<void> {
    await this.academyService.deleteSetting(key);
  }
}
