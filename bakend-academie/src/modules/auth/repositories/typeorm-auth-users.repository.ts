import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { UserStatus } from '../../../core/enums';
import { RefreshTokenEntity } from '../../users/entities/refresh-token.entity';
import { RoleEntity } from '../../users/entities/role.entity';
import { UserEntity } from '../../users/entities/user.entity';
import {
  AuthRefreshSession,
  AuthUserIdentity,
} from '../interfaces/auth-user.interface';
import { AuthUsersRepository } from './auth-users.repository';

@Injectable()
export class TypeOrmAuthUsersRepository implements AuthUsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly rolesRepository: Repository<RoleEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
  ) {}

  async ensureDefaultRoles(): Promise<void> {
    const defaultRoles = [
      { name: 'STUDENT', description: 'Default student role' },
      { name: 'TEACHER', description: 'Teacher role' },
      { name: 'ADMIN', description: 'Administrator role' },
    ];

    for (const role of defaultRoles) {
      const existingRole = await this.rolesRepository.findOne({
        where: { name: role.name },
      });
      if (!existingRole) {
        await this.rolesRepository.save(this.rolesRepository.create(role));
      }
    }
  }

  async findByEmail(email: string): Promise<AuthUserIdentity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail, deletedAt: IsNull() },
      relations: { roles: true },
    });

    return user ? this.toAuthIdentity(user) : null;
  }

  async findById(id: string): Promise<AuthUserIdentity | null> {
    const user = await this.usersRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { roles: true },
    });

    return user ? this.toAuthIdentity(user) : null;
  }

  async createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleNames: string[];
    avatarUrl?: string;
    emailVerified?: boolean;
  }): Promise<AuthUserIdentity> {
    const normalizedRoleNames = input.roleNames.map((role) =>
      role.trim().toUpperCase(),
    );
    const roles = await this.rolesRepository.find({
      where: { name: In(normalizedRoleNames) },
    });

    const created = this.usersRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      avatarUrl: input.avatarUrl,
      status: UserStatus.ACTIVE,
      emailVerified: input.emailVerified ?? false,
      roles,
    });

    const saved = await this.usersRepository.save(created);

    const createdWithRoles = await this.usersRepository.findOne({
      where: { id: saved.id, deletedAt: IsNull() },
      relations: { roles: true },
    });

    if (!createdWithRoles) {
      throw new Error('Created user could not be reloaded');
    }

    return this.toAuthIdentity(createdWithRoles);
  }

  async updateLastLoginAt(userId: string, loginAt: Date): Promise<void> {
    await this.usersRepository.update({ id: userId }, { lastLoginAt: loginAt });
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.usersRepository.update({ id: userId }, { passwordHash });
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.usersRepository.update({ id: userId }, { emailVerified: true });
  }

  async createRefreshSession(input: {
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthRefreshSession> {
    const user = await this.usersRepository.findOne({
      where: { id: input.userId },
    });
    if (!user) {
      throw new Error('User not found when creating refresh session');
    }

    const session = this.refreshTokensRepository.create({
      user,
      tokenHash: '__pending__',
      expiresAt: input.expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      revokedAt: undefined,
    });

    const saved = await this.refreshTokensRepository.save(session);
    return {
      id: saved.id,
      userId: user.id,
      tokenHash: saved.tokenHash,
      expiresAt: saved.expiresAt,
      revokedAt: saved.revokedAt,
    };
  }

  async updateRefreshSessionHash(
    sessionId: string,
    tokenHash: string,
  ): Promise<void> {
    await this.refreshTokensRepository.update({ id: sessionId }, { tokenHash });
  }

  async findRefreshSessionById(
    sessionId: string,
  ): Promise<AuthRefreshSession | null> {
    const session = await this.refreshTokensRepository.findOne({
      where: { id: sessionId },
      relations: { user: true },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      userId: session.user.id,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    };
  }

  async revokeRefreshSession(
    sessionId: string,
    revokedAt: Date,
  ): Promise<void> {
    await this.refreshTokensRepository.update({ id: sessionId }, { revokedAt });
  }

  async revokeAllRefreshSessionsByUserId(
    userId: string,
    revokedAt: Date,
  ): Promise<void> {
    await this.refreshTokensRepository
      .createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ revokedAt })
      .where('"userId" = :userId', { userId })
      .andWhere('"revokedAt" IS NULL')
      .execute();
  }

  private toAuthIdentity(user: UserEntity): AuthUserIdentity {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      emailVerified: user.emailVerified,
      onboardingProfile: user.onboardingProfile ?? null,
      onboardingCompletedAt: user.onboardingCompletedAt ?? null,
      roles: (user.roles ?? []).map((role) => role.name),
      status: user.status,
      passwordHash: user.passwordHash,
    };
  }
}
