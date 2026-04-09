import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { UserStatus } from '../../core/enums';
import { MailService } from '../../integrations/mail';
import { LoginDto } from './dto/login.dto';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  AuthUserIdentity,
  PublicAuthUser,
} from './interfaces/auth-user.interface';
import { AUTH_USERS_REPOSITORY } from './repositories/auth-users.repository';
import type { AuthUsersRepository } from './repositories/auth-users.repository';
import { OAuthIdentity } from './services/oauth.service';
import { PasswordHashService } from './services/password-hash.service';
import { AuthTokens, TokenService } from './services/token.service';

export interface RefreshContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResponse {
  user: PublicAuthUser;
  tokens: AuthTokens;
}

export interface AuthActionFeedback {
  message: string;
  previewToken?: string;
  previewUrl?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_USERS_REPOSITORY)
    private readonly authUsersRepository: AuthUsersRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  // Orchestrates registration flow while delegating hashing and token concerns.
  async register(
    dto: RegisterDto,
    context?: RefreshContext,
  ): Promise<AuthResponse> {
    await this.authUsersRepository.ensureDefaultRoles();

    const existingUser = await this.authUsersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const { firstName, lastName } = this.splitFullName(dto.fullName);
    const roleName = dto.role?.toUpperCase() ?? 'STUDENT';

    const user = await this.authUsersRepository.createUser({
      firstName,
      lastName,
      email: dto.email,
      passwordHash: this.passwordHashService.hash(dto.password),
      roleNames: [roleName],
    });

    const tokens = await this.issueAndStoreTokens(user, context);
    return {
      user: this.toPublicUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto, context?: RefreshContext): Promise<AuthResponse> {
    const user = await this.authUsersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const isPasswordValid = this.passwordHashService.verify(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.authUsersRepository.updateLastLoginAt(user.id, new Date());

    const tokens = await this.issueAndStoreTokens(user, context);
    return {
      user: this.toPublicUser(user),
      tokens,
    };
  }

  async authenticateOAuthIdentity(
    identity: OAuthIdentity,
    input: {
      role?: 'STUDENT' | 'TEACHER';
    },
    context?: RefreshContext,
  ): Promise<AuthResponse> {
    await this.authUsersRepository.ensureDefaultRoles();

    let user = await this.authUsersRepository.findByEmail(identity.email);

    if (user) {
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User account is not active');
      }

      if (!user.emailVerified && identity.emailVerified) {
        await this.authUsersRepository.markEmailAsVerified(user.id);
        user = await this.authUsersRepository.findById(user.id);
      }
    }

    if (!user) {
      user = await this.authUsersRepository.createUser({
        firstName: identity.firstName,
        lastName: identity.lastName,
        email: identity.email,
        passwordHash: this.passwordHashService.hash(
          randomBytes(32).toString('hex'),
        ),
        roleNames: [input.role ?? 'STUDENT'],
        avatarUrl: identity.avatarUrl ?? undefined,
        emailVerified: identity.emailVerified,
      });
    }

    await this.authUsersRepository.updateLastLoginAt(user.id, new Date());

    const currentUser = await this.authUsersRepository.findById(user.id);
    if (!currentUser) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueAndStoreTokens(currentUser, context);
    return {
      user: this.toPublicUser(currentUser),
      tokens,
    };
  }

  async requestEmailVerification(
    dto: RequestEmailVerificationDto,
  ): Promise<AuthActionFeedback> {
    const user = await this.authUsersRepository.findByEmail(dto.email);
    const genericMessage =
      'If the account exists, a verification link has been prepared.';

    if (!user) {
      return { message: genericMessage };
    }

    const token = await this.tokenService.generateEmailVerificationToken({
      user: {
        id: user.id,
        email: user.email,
      },
    });
    const verificationUrl = this.buildFrontendActionUrl('/auth/verify', token, {
      email: user.email,
    });

    await this.mailService.sendVerificationEmail({
      to: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      verificationUrl,
    });

    return this.buildActionFeedback(genericMessage, verificationUrl, token);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthActionFeedback> {
    const payload = await this.tokenService.verifyEmailVerificationToken(
      dto.token,
    );
    const user = await this.authUsersRepository.findById(payload.sub);

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException(
        'Verification request is no longer valid',
      );
    }

    if (!user.emailVerified) {
      await this.authUsersRepository.markEmailAsVerified(user.id);
    }

    return {
      message: 'Your email address has been verified successfully.',
    };
  }

  async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<AuthActionFeedback> {
    const user = await this.authUsersRepository.findByEmail(dto.email);
    const genericMessage =
      'If the account exists, a password reset link has been prepared.';

    if (!user || user.status !== UserStatus.ACTIVE) {
      return { message: genericMessage };
    }

    const token = await this.tokenService.generatePasswordResetToken({
      user: {
        id: user.id,
        email: user.email,
      },
      passwordHash: user.passwordHash,
    });
    const resetUrl = this.buildFrontendActionUrl(
      '/auth/reset-password',
      token,
    );

    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      resetUrl,
    });

    return this.buildActionFeedback(genericMessage, resetUrl, token);
  }

  async resetPassword(
    dto: ResetPasswordDto,
    context?: RefreshContext,
  ): Promise<AuthResponse> {
    const payload = await this.tokenService.verifyPasswordResetToken(dto.token);
    const user = await this.authUsersRepository.findById(payload.sub);

    if (
      !user ||
      user.email !== payload.email ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        'Password reset request is no longer valid',
      );
    }

    const currentPasswordFingerprint =
      this.tokenService.createPasswordFingerprint(user.passwordHash);

    if (currentPasswordFingerprint !== payload.passwordFingerprint) {
      throw new UnauthorizedException(
        'Password reset request is no longer valid',
      );
    }

    const nextPasswordHash = this.passwordHashService.hash(dto.password);
    await this.authUsersRepository.updatePasswordHash(
      user.id,
      nextPasswordHash,
    );
    await this.authUsersRepository.revokeAllRefreshSessionsByUserId(
      user.id,
      new Date(),
    );

    const updatedUser = await this.authUsersRepository.findById(user.id);
    if (!updatedUser) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueAndStoreTokens(updatedUser, context);
    return {
      user: this.toPublicUser(updatedUser),
      tokens,
    };
  }

  async refreshToken(
    refreshToken: string,
    context?: RefreshContext,
  ): Promise<AuthResponse> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const sessionId = payload.sid;
    if (!sessionId) {
      throw new UnauthorizedException('Refresh session identifier is missing');
    }

    const session =
      await this.authUsersRepository.findRefreshSessionById(sessionId);
    if (!session || session.userId !== payload.sub || session.revokedAt) {
      throw new UnauthorizedException('Refresh session not found');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.authUsersRepository.revokeRefreshSession(
        session.id,
        new Date(),
      );
      throw new UnauthorizedException('Refresh token expired');
    }

    const isRefreshTokenValid = this.passwordHashService.verify(
      refreshToken,
      session.tokenHash,
    );
    if (!isRefreshTokenValid) {
      await this.authUsersRepository.revokeRefreshSession(
        session.id,
        new Date(),
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.authUsersRepository.revokeRefreshSession(session.id, new Date());

    const user = await this.authUsersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueAndStoreTokens(user, context);
    return {
      user: this.toPublicUser(user),
      tokens,
    };
  }

  async getProfileFromUserId(userId: string): Promise<PublicAuthUser> {
    const user = await this.authUsersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toPublicUser(user);
  }

  async getProfileFromAccessToken(
    accessToken: string,
  ): Promise<PublicAuthUser> {
    const payload = await this.tokenService.verifyAccessToken(accessToken);
    return this.getProfileFromUserId(payload.sub);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    if (payload.sid) {
      await this.authUsersRepository.revokeRefreshSession(
        payload.sid,
        new Date(),
      );
    }
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.authUsersRepository.revokeAllRefreshSessionsByUserId(
      userId,
      new Date(),
    );
  }

  private async issueAndStoreTokens(
    user: AuthUserIdentity,
    context?: RefreshContext,
  ): Promise<AuthTokens> {
    const refreshExpiryDate = new Date(
      Date.now() +
        this.resolveDurationInSeconds(
          process.env.JWT_REFRESH_EXPIRES_IN,
          7 * 24 * 60 * 60,
        ) *
          1000,
    );

    const session = await this.authUsersRepository.createRefreshSession({
      userId: user.id,
      expiresAt: refreshExpiryDate,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    });

    // Token creation is bound to a persisted refresh session id (sid).
    const tokens = await this.tokenService.generateTokens({
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
      refreshSessionId: session.id,
    });

    await this.authUsersRepository.updateRefreshSessionHash(
      session.id,
      this.passwordHashService.hash(tokens.refreshToken),
    );

    return tokens;
  }

  private toPublicUser(user: AuthUserIdentity): PublicAuthUser {
    // Never expose password hash or internal session details outside auth boundaries.
    return {
      id: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      avatarUrl: user.avatarUrl ?? null,
      emailVerified: user.emailVerified,
      roles: user.roles,
    };
  }

  private buildActionFeedback(
    message: string,
    actionUrl: string,
    token: string,
  ): AuthActionFeedback {
    if (process.env.NODE_ENV === 'production') {
      return { message };
    }

    return {
      message,
      previewToken: token,
      previewUrl: actionUrl,
    };
  }

  private buildFrontendActionUrl(
    frontendPath: string,
    token: string,
    queryParams?: Record<string, string>,
  ) {
    const frontendOrigin = (
      process.env.FRONTEND_APP_ORIGIN ?? 'http://localhost:3000'
    ).trim();
    const actionUrl = new URL(frontendPath, frontendOrigin);
    actionUrl.searchParams.set('token', token);

    Object.entries(queryParams ?? {}).forEach(([key, value]) => {
      actionUrl.searchParams.set(key, value);
    });

    return actionUrl.toString();
  }

  private splitFullName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    const cleanedName = fullName.trim().replace(/\s+/g, ' ');
    const [firstName, ...otherParts] = cleanedName.split(' ');
    const lastName = otherParts.join(' ');

    return {
      firstName,
      lastName: lastName || firstName,
    };
  }

  private resolveDurationInSeconds(
    rawValue: string | undefined,
    fallbackSeconds: number,
  ): number {
    if (!rawValue) {
      return fallbackSeconds;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (/^\d+$/.test(normalized)) {
      return Number(normalized);
    }

    const match = normalized.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return fallbackSeconds;
    }

    const quantity = Number(match[1]);
    const multiplierByUnit: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return quantity * multiplierByUnit[match[2]];
  }
}
