import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { USER_PERMISSIONS } from '../../core/constants';
import { UserRole } from '../../core/enums';
import {
  AVATAR_UPLOADS_DIRECTORY_PATH,
  ensureStorageDirectories,
} from '../../integrations/storage';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ExportUserDataResponseDto } from './dto/export-user-data-response.dto';
import { RequestDataDeletionResponseDto } from './dto/request-data-deletion-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserEntity } from './entities/user.entity';
import { UserSelfOrAdminGuard } from './guards/user-self-or-admin.guard';
import { UsersService } from './users.service';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

interface UploadedAvatarFile {
  filename: string;
  mimetype: string;
  originalname: string;
}

function resolveAvatarExtension(file: UploadedAvatarFile) {
  const originalExtension = extname(file.originalname).toLowerCase();

  if (originalExtension) {
    return originalExtension;
  }

  if (file.mimetype === 'image/png') {
    return '.png';
  }

  if (file.mimetype === 'image/webp') {
    return '.webp';
  }

  if (file.mimetype === 'image/gif') {
    return '.gif';
  }

  return '.jpg';
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Permissions(USER_PERMISSIONS.USERS_READ)
  @Get()
  async listUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersService.listUsers();
    return users.map((user) => this.toResponse(user));
  }

  @Roles(UserRole.ADMIN)
  @Permissions(USER_PERMISSIONS.USERS_CREATE)
  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.createUser(dto);
    return this.toResponse(user);
  }

  @Get('me')
  async me(@CurrentUser('sub') userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.getUserById(userId);
    return this.toResponse(user);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateUser(userId, dto);
    return this.toResponse(user);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureStorageDirectories();
          callback(null, AVATAR_UPLOADS_DIRECTORY_PATH);
        },
        filename: (_request, file: UploadedAvatarFile, callback) => {
          callback(
            null,
            `${Date.now()}-${randomUUID()}${resolveAvatarExtension(file)}`,
          );
        },
      }),
      fileFilter: (_request, file: UploadedAvatarFile, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(
            new BadRequestException('Only image files can be uploaded.'),
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: MAX_AVATAR_SIZE_BYTES,
      },
    }),
  )
  async uploadMyAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file?: UploadedAvatarFile,
  ): Promise<UserResponseDto> {
    if (!file?.filename) {
      throw new BadRequestException('A profile image file is required.');
    }

    const user = await this.usersService.updateUserAvatar(userId, file.filename);
    return this.toResponse(user);
  }

  @Post('me/export')
  async exportMyData(
    @CurrentUser('sub') userId: string,
  ): Promise<ExportUserDataResponseDto> {
    return this.usersService.exportMyData(userId);
  }

  @Post('me/request-deletion')
  async requestMyDataDeletion(
    @CurrentUser('sub') userId: string,
  ): Promise<RequestDataDeletionResponseDto> {
    return this.usersService.requestMyDataDeletion(userId);
  }

  @UseGuards(UserSelfOrAdminGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.getUserById(id);
    return this.toResponse(user);
  }

  @UseGuards(UserSelfOrAdminGuard)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateUser(id, dto);
    return this.toResponse(user);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(USER_PERMISSIONS.USERS_ASSIGN_ROLES)
  @Patch(':id/roles')
  async assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.assignRoles(id, dto);
    return this.toResponse(user);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(USER_PERMISSIONS.USERS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteUser(id);
  }

  private toResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      status: user.status,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      country: user.country,
      city: user.city,
      onboardingProfile: user.onboardingProfile,
      onboardingCompletedAt: user.onboardingCompletedAt,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      roles: (user.roles ?? []).map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })),
    };
  }
}
