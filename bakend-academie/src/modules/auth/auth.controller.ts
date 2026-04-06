import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CurrentRefreshToken } from '../../core/decorators/current-refresh-token.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { RateLimit } from '../../core/decorators/rate-limit.decorator';
import { JwtRefreshGuard } from '../../core/guards/jwt-refresh.guard';
import { RateLimitGuard } from '../../core/guards/rate-limit.guard';
import { AuthResponse, AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PublicAuthUser } from './interfaces/auth-user.interface';
import type { TokenPayload } from './services/token.service';

const REFRESH_COOKIE_NAME = 'refreshToken';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Public endpoint for account creation.
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });
    this.attachRefreshCookie(response, result.tokens.refreshToken);
    return result;
  }

  // Public endpoint for password-based authentication.
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 8 })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });
    this.attachRefreshCookie(
      response,
      result.tokens.refreshToken,
      dto.rememberSession !== false,
    );
    return result;
  }

  // Public endpoint guarded by refresh cookie that rotates both tokens.
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @CurrentRefreshToken() refreshToken: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.refreshToken(refreshToken, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });
    this.attachRefreshCookie(response, result.tokens.refreshToken);
    return result;
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @CurrentRefreshToken() refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(refreshToken);
    response.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser('sub') userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logoutAllSessions(userId);
    response.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 8 })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 8 })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.resetPassword(dto, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });
    this.attachRefreshCookie(
      response,
      result.tokens.refreshToken,
      dto.rememberSession !== false,
    );
    return result;
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 8 })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email/request')
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestEmailVerification(dto);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 8 })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Get('me')
  async me(@CurrentUser() user: TokenPayload): Promise<PublicAuthUser> {
    return this.authService.getProfileFromUserId(user.sub);
  }

  private attachRefreshCookie(
    response: Response,
    refreshToken: string,
    rememberSession = true,
  ): void {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...this.getRefreshCookieOptions(),
      ...(rememberSession ? { maxAge: this.resolveRefreshCookieMaxAge() } : {}),
    });
  }

  private getRefreshCookieOptions() {
    const apiPrefix = process.env.API_PREFIX ?? 'api';
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: `/${apiPrefix}/auth`,
    };
  }

  // Keeps cookie TTL aligned with refresh token lifetime.
  private resolveRefreshCookieMaxAge(): number {
    const rawValue = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
    const normalized = rawValue.trim().toLowerCase();
    if (/^\d+$/.test(normalized)) {
      return Number(normalized) * 1000;
    }

    const match = normalized.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const quantity = Number(match[1]);
    const multiplierByUnit: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return quantity * multiplierByUnit[match[2]];
  }
}
