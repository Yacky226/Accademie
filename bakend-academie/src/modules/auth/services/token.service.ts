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

    const accessToken = await this.jwtService.signAsync(
      accessPayload,
      { expiresIn: this.resolveDurationInSeconds(process.env.JWT_EXPIRES_IN, 15 * 60) },
    );

    const refreshToken = await this.jwtService.signAsync(
      refreshPayload,
      {
        expiresIn: this.resolveDurationInSeconds(
          process.env.JWT_REFRESH_EXPIRES_IN,
          7 * 24 * 60 * 60,
        ),
      },
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.verifyTokenByType(token, 'access');
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.verifyTokenByType(token, 'refresh');
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
        throw new UnauthorizedException('Refresh session identifier is missing');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Parses values like "15m", "1h", "7d" into seconds for jwt options.
  private resolveDurationInSeconds(rawValue: string | undefined, fallbackSeconds: number): number {
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
