import {
  AuthRefreshSession,
  AuthUserIdentity,
} from '../interfaces/auth-user.interface';

export const AUTH_USERS_REPOSITORY = Symbol('AUTH_USERS_REPOSITORY');

export interface AuthUsersRepository {
  ensureDefaultRoles(): Promise<void>;
  findByEmail(email: string): Promise<AuthUserIdentity | null>;
  findById(id: string): Promise<AuthUserIdentity | null>;
  createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleNames: string[];
  }): Promise<AuthUserIdentity>;
  updateLastLoginAt(userId: string, loginAt: Date): Promise<void>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
  markEmailAsVerified(userId: string): Promise<void>;
  createRefreshSession(input: {
    userId: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthRefreshSession>;
  updateRefreshSessionHash(sessionId: string, tokenHash: string): Promise<void>;
  findRefreshSessionById(sessionId: string): Promise<AuthRefreshSession | null>;
  revokeRefreshSession(sessionId: string, revokedAt: Date): Promise<void>;
  revokeAllRefreshSessionsByUserId(
    userId: string,
    revokedAt: Date,
  ): Promise<void>;
}
