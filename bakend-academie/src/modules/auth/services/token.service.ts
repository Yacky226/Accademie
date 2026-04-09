import { createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
  sid?: string;
}

interface EmailVerificationTokenPayload {
  sub: string;
  email: string;
  type: 'email-verification';
}

interface PasswordResetTokenPayload {
  sub: string;
  email: string;
  passwordFingerprint: string;
  type: 'password-reset';
}

export interface OAuthStateTokenPayload {
  provider: 'google' | 'github';
  mode: 'login' | 'register';
  frontendOrigin?: string;
  redirectTo?: string;
  role: 'STUDENT' | 'TEACHER';
  type: 'oauth-state';
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateTokens(input: {
    user: { id: string; email: string; roles: string[] };
    refreshSessionId: string;
  }): Promise<AuthTokens> {
    const basePayload = {
      sub: input.user.id,
      email: input.user.email,
      roles: input.user.roles,
    };

    const accessPayload: TokenPayload = { ...basePayload, type: 'access' };
    const refreshPayload: TokenPayload = {
      ...basePayload,
      type: 'refresh',
      sid: input.refreshSessionId,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: this.resolveDurationInSeconds(
        process.env.JWT_EXPIRES_IN,
        15 * 60,
      ),
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: this.resolveDurationInSeconds(
        process.env.JWT_REFRESH_EXPIRES_IN,
        7 * 24 * 60 * 60,
      ),
    });

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.verifyTokenByType(token, 'access');
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.verifyTokenByType(token, 'refresh');
  }

  async generateEmailVerificationToken(input: {
    user: { id: string; email: string };
  }): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: input.user.id,
        email: input.user.email,
        type: 'email-verification',
      } satisfies EmailVerificationTokenPayload,
      {
        expiresIn: this.resolveDurationInSeconds(
          process.env.JWT_EMAIL_VERIFICATION_EXPIRES_IN,
          24 * 60 * 60,
        ),
      },
    );
  }

  async verifyEmailVerificationToken(
    token: string,
  ): Promise<EmailVerificationTokenPayload> {
    return this.verifyActionTokenByType(token, 'email-verification');
  }

  async generatePasswordResetToken(input: {
    user: { id: string; email: string };
    passwordHash: string;
  }): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: input.user.id,
        email: input.user.email,
        passwordFingerprint: this.createPasswordFingerprint(input.passwordHash),
        type: 'password-reset',
      } satisfies PasswordResetTokenPayload,
      {
        expiresIn: this.resolveDurationInSeconds(
          process.env.JWT_PASSWORD_RESET_EXPIRES_IN,
          30 * 60,
        ),
      },
    );
  }

  async verifyPasswordResetToken(
    token: string,
  ): Promise<PasswordResetTokenPayload> {
    return this.verifyActionTokenByType(token, 'password-reset');
  }

  async generateOAuthStateToken(input: {
    provider: OAuthStateTokenPayload['provider'];
    mode: OAuthStateTokenPayload['mode'];
    frontendOrigin?: string;
    redirectTo?: string;
    role: OAuthStateTokenPayload['role'];
  }): Promise<string> {
    return this.jwtService.signAsync(
      {
        frontendOrigin: input.frontendOrigin,
        provider: input.provider,
        mode: input.mode,
        redirectTo: input.redirectTo,
        role: input.role,
        type: 'oauth-state',
      } satisfies OAuthStateTokenPayload,
      {
        expiresIn: this.resolveDurationInSeconds(
          process.env.JWT_OAUTH_STATE_EXPIRES_IN,
          10 * 60,
        ),
      },
    );
  }

  async verifyOAuthStateToken(token: string): Promise<OAuthStateTokenPayload> {
    return this.verifyActionTokenByType(token, 'oauth-state');
  }

  createPasswordFingerprint(passwordHash: string) {
    return createHash('sha256').update(passwordHash).digest('hex').slice(0, 32);
  }

  private async verifyTokenByType(
    token: string,
    expectedType: TokenPayload['type'],
  ): Promise<TokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);
      if (!payload || payload.type !== expectedType) {
        throw new UnauthorizedException('Invalid token type');
      }

      if (expectedType === 'refresh' && !payload.sid) {
        throw new UnauthorizedException(
          'Refresh session identifier is missing',
        );
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async verifyActionTokenByType<
    TPayload extends
      | EmailVerificationTokenPayload
      | PasswordResetTokenPayload
      | OAuthStateTokenPayload,
  >(token: string, expectedType: TPayload['type']): Promise<TPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<TPayload>(token);
      if (!payload || payload.type !== expectedType) {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Parses values like "15m", "1h", "7d" into seconds for jwt options.
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
    const unit = match[2];
    const multiplierByUnit: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return quantity * multiplierByUnit[unit];
  }
}
