import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserStatus } from '../../../core/enums';
import {
  AuthRefreshSession,
  AuthUserIdentity,
} from '../interfaces/auth-user.interface';
import { AuthUsersRepository } from './auth-users.repository';

@Injectable()
export class InMemoryAuthUsersRepository implements AuthUsersRepository {
  private readonly usersById = new Map<string, AuthUserIdentity>();
  private readonly userIdByEmail = new Map<string, string>();
  private readonly sessionsById = new Map<string, AuthRefreshSession>();

  ensureDefaultRoles(): Promise<void> {
    return Promise.resolve();
  }

  findByEmail(email: string): Promise<AuthUserIdentity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = this.userIdByEmail.get(normalizedEmail);
    if (!userId) {
      return Promise.resolve(null);
    }

    return Promise.resolve(this.usersById.get(userId) ?? null);
  }

  findById(id: string): Promise<AuthUserIdentity | null> {
    return Promise.resolve(this.usersById.get(id) ?? null);
  }

  createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleNames: string[];
  }): Promise<AuthUserIdentity> {
    const id = randomUUID();
    const normalizedEmail = input.email.trim().toLowerCase();
    const user: AuthUserIdentity = {
      id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: normalizedEmail,
      avatarUrl: null,
      emailVerified: false,
      onboardingProfile: null,
      onboardingCompletedAt: null,
      roles: input.roleNames,
      status: UserStatus.ACTIVE,
      passwordHash: input.passwordHash,
    };

    this.usersById.set(id, user);
    this.userIdByEmail.set(normalizedEmail, id);
    return Promise.resolve(user);
  }

  updateLastLoginAt(userId: string, loginAt: Date): Promise<void> {
    void userId;
    void loginAt;
    return Promise.resolve();
  }

  updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.usersById.get(userId);
    if (!user) {
      return Promise.resolve();
    }

    this.usersById.set(userId, {
      ...user,
      passwordHash,
    });
    return Promise.resolve();
  }

  markEmailAsVerified(userId: string): Promise<void> {
    const user = this.usersById.get(userId);
    if (!user) {
      return Promise.resolve();
    }

    this.usersById.set(userId, {
      ...user,
      emailVerified: true,
    });
    return Promise.resolve();
  }

  createRefreshSession(input: {
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthRefreshSession> {
    const session: AuthRefreshSession = {
      id: randomUUID(),
      userId: input.userId,
      tokenHash: '__pending__',
      expiresAt: input.expiresAt,
      revokedAt: undefined,
    };
    this.sessionsById.set(session.id, session);
    return Promise.resolve(session);
  }

  updateRefreshSessionHash(
    sessionId: string,
    tokenHash: string,
  ): Promise<void> {
    const session = this.sessionsById.get(sessionId);
    if (!session) {
      return Promise.resolve();
    }

    this.sessionsById.set(sessionId, {
      ...session,
      tokenHash,
    });
    return Promise.resolve();
  }

  findRefreshSessionById(
    sessionId: string,
  ): Promise<AuthRefreshSession | null> {
    return Promise.resolve(this.sessionsById.get(sessionId) ?? null);
  }

  revokeRefreshSession(sessionId: string, revokedAt: Date): Promise<void> {
    const session = this.sessionsById.get(sessionId);
    if (!session) {
      return Promise.resolve();
    }

    this.sessionsById.set(sessionId, {
      ...session,
      revokedAt,
    });
    return Promise.resolve();
  }

  revokeAllRefreshSessionsByUserId(
    userId: string,
    revokedAt: Date,
  ): Promise<void> {
    for (const [sessionId, session] of this.sessionsById.entries()) {
      if (session.userId === userId && !session.revokedAt) {
        this.sessionsById.set(sessionId, {
          ...session,
          revokedAt,
        });
      }
    }
    return Promise.resolve();
  }
}
