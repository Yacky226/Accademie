import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserStatus } from '../../../core/enums';
import { AuthRefreshSession, AuthUserIdentity } from '../interfaces/auth-user.interface';
import { AuthUsersRepository } from './auth-users.repository';

@Injectable()
export class InMemoryAuthUsersRepository implements AuthUsersRepository {
  private readonly usersById = new Map<string, AuthUserIdentity>();
  private readonly userIdByEmail = new Map<string, string>();
  private readonly sessionsById = new Map<string, AuthRefreshSession>();

  async ensureDefaultRoles(): Promise<void> {
    return;
  }

  async findByEmail(email: string): Promise<AuthUserIdentity | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = this.userIdByEmail.get(normalizedEmail);
    if (!userId) {
      return null;
    }

    return this.usersById.get(userId) ?? null;
  }

  async findById(id: string): Promise<AuthUserIdentity | null> {
    return this.usersById.get(id) ?? null;
  }

  async createUser(input: {
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
      roles: input.roleNames,
      status: UserStatus.ACTIVE,
      passwordHash: input.passwordHash,
    };

    this.usersById.set(id, user);
    this.userIdByEmail.set(normalizedEmail, id);
    return user;
  }

  async updateLastLoginAt(_userId: string, _loginAt: Date): Promise<void> {
    return;
  }

  async createRefreshSession(input: {
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
    return session;
  }

  async updateRefreshSessionHash(sessionId: string, tokenHash: string): Promise<void> {
    const session = this.sessionsById.get(sessionId);
    if (!session) {
      return;
    }

    this.sessionsById.set(sessionId, {
      ...session,
      tokenHash,
    });
  }

  async findRefreshSessionById(sessionId: string): Promise<AuthRefreshSession | null> {
    return this.sessionsById.get(sessionId) ?? null;
  }

  async revokeRefreshSession(sessionId: string, revokedAt: Date): Promise<void> {
    const session = this.sessionsById.get(sessionId);
    if (!session) {
      return;
    }

    this.sessionsById.set(sessionId, {
      ...session,
      revokedAt,
    });
  }

  async revokeAllRefreshSessionsByUserId(userId: string, revokedAt: Date): Promise<void> {
    for (const [sessionId, session] of this.sessionsById.entries()) {
      if (session.userId === userId && !session.revokedAt) {
        this.sessionsById.set(sessionId, {
          ...session,
          revokedAt,
        });
      }
    }
  }
}
