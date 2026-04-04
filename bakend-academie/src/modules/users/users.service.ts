import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '../../core/enums';
import { PasswordHashService } from '../auth/services/password-hash.service';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ExportUserDataResponseDto } from './dto/export-user-data-response.dto';
import { RequestDataDeletionResponseDto } from './dto/request-data-deletion-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHashService: PasswordHashService,
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

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }
      user.email = dto.email.toLowerCase();
    }

    user.firstName = dto.firstName ?? user.firstName;
    user.lastName = dto.lastName ?? user.lastName;
    user.phone = dto.phone ?? user.phone;
    user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
    user.bio = dto.bio ?? user.bio;
    user.status = dto.status ?? user.status;
    user.gender = dto.gender ?? user.gender;
    user.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : user.dateOfBirth;
    user.country = dto.country ?? user.country;
    user.city = dto.city ?? user.city;

    if (dto.password) {
      user.passwordHash = this.passwordHashService.hash(dto.password);
    }

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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async requestMyDataDeletion(userId: string): Promise<RequestDataDeletionResponseDto> {
    const user = await this.getUserById(userId);
    const deletedAt = new Date();

    user.email = `deleted_${user.id}@anonymized.local`;
    user.firstName = 'Deleted';
    user.lastName = 'User';
    user.phone = undefined;
    user.avatarUrl = undefined;
    user.bio = undefined;
    user.country = undefined;
    user.city = undefined;
    user.status = UserStatus.INACTIVE;

    await this.usersRepository.save(user);
    await this.usersRepository.softDelete(user);

    return {
      message: 'Data deletion request processed',
      deletedAt: deletedAt.toISOString(),
    };
  }
}
