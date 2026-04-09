import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '../../core/enums';
import { StorageService } from '../../integrations/storage';
import { PasswordHashService } from '../auth/services/password-hash.service';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ExportUserDataResponseDto } from './dto/export-user-data-response.dto';
import { RequestDataDeletionResponseDto } from './dto/request-data-deletion-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';

function normalizeOptionalText(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeOnboardingProfile(
  input: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!input) {
    return undefined;
  }

  const normalizedEntries = Object.entries(input).reduce<Record<string, string>>(
    (result, [key, value]) => {
      if (typeof value !== 'string') {
        return result;
      }

      const normalizedKey = key.trim();
      const normalizedValue = value.trim();

      if (!normalizedKey || !normalizedValue) {
        return result;
      }

      result[normalizedKey] = normalizedValue;
      return result;
    },
    {},
  );

  return Object.keys(normalizedEntries).length > 0 ? normalizedEntries : undefined;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly storageService: StorageService,
  ) {}

  async listUsers(): Promise<UserEntity[]> {
    await this.usersRepository.ensureDefaultRoles();
    return this.usersRepository.findAll();
  }

  // Responsible only for user-creation orchestration.
  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const user = new UserEntity();
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.email = dto.email.toLowerCase();
    user.phone = dto.phone;
    user.passwordHash = this.passwordHashService.hash(dto.password);
    user.avatarUrl = dto.avatarUrl;
    user.bio = dto.bio;
    user.status = dto.status ?? UserStatus.ACTIVE;
    user.gender = dto.gender;
    user.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined;
    user.country = dto.country;
    user.city = dto.city;
    user.onboardingProfile = normalizeOnboardingProfile(dto.onboardingProfile);
    user.onboardingCompletedAt = dto.onboardingCompletedAt
      ? new Date(dto.onboardingCompletedAt)
      : undefined;
    user.emailVerified = false;
    user.roles = [];

    if (dto.roleNames?.length) {
      const roles = await this.usersRepository.findRolesByNames(dto.roleNames);
      user.roles = roles;
    }

    return this.usersRepository.save(user);
  }

  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.getUserById(id);
    const normalizedEmail = dto.email?.trim().toLowerCase();

    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(normalizedEmail);
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }
      user.email = normalizedEmail;
    }

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName.trim();
    }

    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName.trim();
    }

    if (dto.phone !== undefined) {
      user.phone = normalizeOptionalText(dto.phone) ?? undefined;
    }

    if (dto.avatarUrl !== undefined) {
      const normalizedAvatarUrl = normalizeOptionalText(dto.avatarUrl);

      if (normalizedAvatarUrl !== user.avatarUrl) {
        this.storageService.deleteManagedAvatar(user.avatarUrl);
        user.avatarUrl = normalizedAvatarUrl ?? undefined;
      }
    }

    if (dto.bio !== undefined) {
      user.bio = normalizeOptionalText(dto.bio) ?? undefined;
    }

    user.status = dto.status ?? user.status;
    user.gender = dto.gender ?? user.gender;
    user.dateOfBirth = dto.dateOfBirth
      ? new Date(dto.dateOfBirth)
      : user.dateOfBirth;

    if (dto.country !== undefined) {
      user.country = normalizeOptionalText(dto.country) ?? undefined;
    }

    if (dto.city !== undefined) {
      user.city = normalizeOptionalText(dto.city) ?? undefined;
    }

    if (dto.onboardingProfile !== undefined) {
      user.onboardingProfile = normalizeOnboardingProfile(dto.onboardingProfile);
    }

    if (dto.onboardingCompletedAt !== undefined) {
      user.onboardingCompletedAt = dto.onboardingCompletedAt
        ? new Date(dto.onboardingCompletedAt)
        : undefined;
    }

    if (dto.password) {
      user.passwordHash = this.passwordHashService.hash(dto.password);
    }

    return this.usersRepository.save(user);
  }

  async updateUserAvatar(id: string, fileName: string): Promise<UserEntity> {
    const user = await this.getUserById(id);

    this.storageService.deleteManagedAvatar(user.avatarUrl);
    user.avatarUrl = this.storageService.buildAvatarPublicUrl(fileName);

    return this.usersRepository.save(user);
  }

  async assignRoles(id: string, dto: AssignRolesDto): Promise<UserEntity> {
    const user = await this.getUserById(id);
    const roles = await this.usersRepository.findRolesByNames(dto.roleNames);
    user.roles = roles;
    return this.usersRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    this.storageService.deleteManagedAvatar(user.avatarUrl);
    await this.usersRepository.softDelete(user);
  }

  async exportMyData(userId: string): Promise<ExportUserDataResponseDto> {
    const user = await this.getUserById(userId);

    return {
      generatedAt: new Date().toISOString(),
      legalBasis: 'RGPD - droit d acces (Article 15)',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        country: user.country,
        city: user.city,
        roles: (user.roles ?? []).map((role) => role.name),
        onboardingProfile: user.onboardingProfile,
        onboardingCompletedAt: user.onboardingCompletedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async requestMyDataDeletion(
    userId: string,
  ): Promise<RequestDataDeletionResponseDto> {
    const user = await this.getUserById(userId);
    const deletedAt = new Date();

    this.storageService.deleteManagedAvatar(user.avatarUrl);
    user.email = `deleted_${user.id}@anonymized.local`;
    user.firstName = 'Deleted';
    user.lastName = 'User';
    user.phone = undefined;
    user.avatarUrl = undefined;
    user.bio = undefined;
    user.country = undefined;
    user.city = undefined;
    user.onboardingProfile = undefined;
    user.onboardingCompletedAt = undefined;
    user.status = UserStatus.INACTIVE;

    await this.usersRepository.save(user);
    await this.usersRepository.softDelete(user);

    return {
      message: 'Data deletion request processed',
      deletedAt: deletedAt.toISOString(),
    };
  }
}
