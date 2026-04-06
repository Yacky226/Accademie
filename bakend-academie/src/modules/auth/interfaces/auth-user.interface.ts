import { UserStatus } from '../../../core/enums';

export interface AuthUserIdentity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  roles: string[];
  status: UserStatus;
  passwordHash: string;
}

export interface PublicAuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  roles: string[];
}

export interface AuthRefreshSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
}
