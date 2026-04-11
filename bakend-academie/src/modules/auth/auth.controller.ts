import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
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
import { OAuthMode, OAuthProvider, OAuthService } from './services/oauth.service';
import type { TokenPayload } from './services/token.service';

const REFRESH_COOKIE_NAME = 'refreshToken';
const OAUTH_STATE_COOKIE_NAME = 'oauthState';
const OAUTH_CODE_VERIFIER_COOKIE_NAME = 'oauthCodeVerifier';
const SESSION_STATUS_COOKIE = 'aa_session_state';
const SESSION_ROLE_COOKIE = 'aa_session_role';
const SESSION_NAME_COOKIE = 'aa_session_name';
const SESSION_AVATAR_COOKIE = 'aa_session_avatar';
const SESSION_EMAIL_COOKIE = 'aa_session_email';
const SESSION_ID_COOKIE = 'aa_session_id';
const SESSION_VERIFIED_COOKIE = 'aa_session_verified';
const SESSION_ONBOARDING_COMPLETED_COOKIE = 'aa_session_onboarding_completed';
const SESSION_ONBOARDING_STEP_COOKIE = 'aa_session_onboarding_step';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
  ) {}

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
    this.attachFrontendSessionCookies(response, result.user);
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
    this.attachFrontendSessionCookies(
      response,
      result.user,
      dto.rememberSession !== false,
    );
    return result;
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 20 })
  @Get('oauth/:provider')
  async startOAuth(
    @Req() request: Request,
    @Res() response: Response,
    @Query('frontend') frontend?: string,
    @Query('mode') mode?: string,
    @Query('redirect') redirect?: string,
    @Query('role') role?: string,
  ): Promise<void> {
    const provider = this.resolveOAuthProvider(
      request.params.provider as string | undefined,
    );

    try {
      const authorizationRequest =
        await this.oauthService.createAuthorizationRequest(provider, {
          frontendOrigin: frontend,
          mode,
          redirectTo: redirect,
          role,
        });

      this.attachOAuthCookie(
        response,
        OAUTH_STATE_COOKIE_NAME,
        authorizationRequest.state,
      );
      this.attachOAuthCookie(
        response,
        OAUTH_CODE_VERIFIER_COOKIE_NAME,
        authorizationRequest.codeVerifier,
      );
      response.redirect(authorizationRequest.authorizationUrl);
    } catch (error) {
      response.redirect(
        this.oauthService.buildFrontendCallbackUrl({
          frontendOrigin: frontend,
          provider,
          mode: this.resolveOAuthMode(mode),
          redirectTo: this.sanitizeRedirectTarget(redirect),
          errorMessage: this.resolveOAuthErrorMessage(
            error,
            `Impossible de demarrer la connexion ${provider}.`,
          ),
        }),
      );
    }
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 20 })
  @Get('oauth/:provider/callback')
  async handleOAuthCallback(
    @Req() request: Request,
    @Res() response: Response,
    @Query('code') code?: string,
    @Query('error') providerError?: string,
    @Query('error_description') providerErrorDescription?: string,
    @Query('state') state?: string,
  ): Promise<void> {
    const provider = this.resolveOAuthProvider(
      request.params.provider as string | undefined,
    );
    const storedState = request.cookies?.[OAUTH_STATE_COOKIE_NAME] as
      | string
      | undefined;
    const storedCodeVerifier = request.cookies?.[OAUTH_CODE_VERIFIER_COOKIE_NAME] as
      | string
      | undefined;
    const oauthState =
      (await this.oauthService.readStateToken(state ?? storedState ?? '')) ??
      (storedState
        ? await this.oauthService.readStateToken(storedState)
        : null);

    try {
      if (providerError) {
        throw new UnauthorizedException(
          providerErrorDescription || providerError,
        );
      }

      if (!state || !storedState || state !== storedState) {
        throw new UnauthorizedException('OAuth state validation failed');
      }

      const callbackContext = await this.oauthService.resolveCallback(
        provider,
        {
          code: code ?? '',
          codeVerifier: storedCodeVerifier ?? '',
          state,
        },
      );
      const result = await this.authService.authenticateOAuthIdentity(
        callbackContext.identity,
        { role: callbackContext.role },
        {
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        },
      );

      this.attachRefreshCookie(response, result.tokens.refreshToken, true);
      this.attachFrontendSessionCookies(response, result.user, true);
      this.clearOAuthCookies(response);
      response.redirect(
        this.buildFrontendPostAuthSuccessUrl({
          frontendOrigin: callbackContext.frontendOrigin,
          mode: callbackContext.mode,
          redirectTo: callbackContext.redirectTo,
          user: result.user,
        }),
      );
    } catch (error) {
      this.clearOAuthCookies(response);
      response.redirect(
        this.oauthService.buildFrontendCallbackUrl({
          frontendOrigin: oauthState?.frontendOrigin ?? null,
          provider,
          mode: oauthState?.mode,
          redirectTo: oauthState?.redirectTo ?? null,
          errorMessage: this.resolveOAuthErrorMessage(
            error,
            `Impossible de finaliser la connexion ${provider}.`,
          ),
        }),
      );
    }
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
    this.attachFrontendSessionCookies(response, result.user);
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
    this.clearFrontendSessionCookies(response);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser('sub') userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logoutAllSessions(userId);
    response.clearCookie(REFRESH_COOKIE_NAME, this.getRefreshCookieOptions());
    this.clearFrontendSessionCookies(response);
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
    this.attachFrontendSessionCookies(
      response,
      result.user,
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

  private attachFrontendSessionCookies(
    response: Response,
    user: PublicAuthUser,
    rememberSession = true,
  ): void {
    const cookieOptions = {
      ...this.getFrontendSessionCookieOptions(),
      ...(rememberSession ? { maxAge: this.resolveRefreshCookieMaxAge() } : {}),
    };

    response.cookie(SESSION_STATUS_COOKIE, 'authenticated', cookieOptions);
    response.cookie(
      SESSION_ROLE_COOKIE,
      this.resolvePrimaryFrontendRole(user.roles),
      cookieOptions,
    );
    response.cookie(
      SESSION_NAME_COOKIE,
      user.fullName.trim() || 'Architect Academy',
      cookieOptions,
    );
    response.cookie(SESSION_EMAIL_COOKIE, user.email, cookieOptions);
    response.cookie(SESSION_ID_COOKIE, user.id, cookieOptions);
    response.cookie(
      SESSION_VERIFIED_COOKIE,
      user.emailVerified ? 'true' : 'false',
      cookieOptions,
    );
    const onboardingState = this.resolveOnboardingState(user);
    response.cookie(
      SESSION_ONBOARDING_COMPLETED_COOKIE,
      onboardingState.completed ? 'true' : 'false',
      cookieOptions,
    );

    if (onboardingState.nextStep) {
      response.cookie(
        SESSION_ONBOARDING_STEP_COOKIE,
        onboardingState.nextStep,
        cookieOptions,
      );
    } else {
      response.clearCookie(
        SESSION_ONBOARDING_STEP_COOKIE,
        this.getFrontendSessionCookieOptions(),
      );
    }

    if (user.avatarUrl?.trim()) {
      response.cookie(SESSION_AVATAR_COOKIE, user.avatarUrl.trim(), cookieOptions);
      return;
    }

    response.clearCookie(SESSION_AVATAR_COOKIE, this.getFrontendSessionCookieOptions());
  }

  private clearFrontendSessionCookies(response: Response): void {
    [
      SESSION_STATUS_COOKIE,
      SESSION_ROLE_COOKIE,
      SESSION_NAME_COOKIE,
      SESSION_AVATAR_COOKIE,
      SESSION_EMAIL_COOKIE,
      SESSION_ID_COOKIE,
      SESSION_VERIFIED_COOKIE,
      SESSION_ONBOARDING_COMPLETED_COOKIE,
      SESSION_ONBOARDING_STEP_COOKIE,
    ].forEach((cookieName) => {
      response.clearCookie(cookieName, this.getFrontendSessionCookieOptions());
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

  private getFrontendSessionCookieOptions() {
    return {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  private attachOAuthCookie(
    response: Response,
    name: string,
    value: string,
  ): void {
    response.cookie(name, value, {
      ...this.getOAuthCookieOptions(),
      maxAge: 10 * 60 * 1000,
    });
  }

  private clearOAuthCookies(response: Response): void {
    response.clearCookie(OAUTH_STATE_COOKIE_NAME, this.getOAuthCookieOptions());
    response.clearCookie(
      OAUTH_CODE_VERIFIER_COOKIE_NAME,
      this.getOAuthCookieOptions(),
    );
  }

  private getOAuthCookieOptions() {
    const apiPrefix = process.env.API_PREFIX ?? 'api';
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: `/${apiPrefix}/auth/oauth`,
    };
  }

  private resolveOAuthProvider(provider: string | undefined): OAuthProvider {
    if (provider === 'google' || provider === 'github') {
      return provider;
    }

    throw new UnauthorizedException('Unsupported OAuth provider');
  }

  private resolveOAuthMode(mode?: string): OAuthMode {
    return mode?.trim().toLowerCase() === 'register' ? 'register' : 'login';
  }

  private sanitizeRedirectTarget(redirect?: string) {
    if (!redirect) {
      return null;
    }

    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
      return null;
    }

    return redirect;
  }

  private resolveOAuthErrorMessage(error: unknown, fallbackMessage: string) {
    return error instanceof Error && error.message.trim()
      ? error.message
      : fallbackMessage;
  }

  private buildFrontendPostAuthSuccessUrl(input: {
    frontendOrigin?: string | null;
    mode: OAuthMode;
    redirectTo?: string | null;
    user: PublicAuthUser;
  }) {
    const role = this.resolvePrimaryFrontendRole(input.user.roles);
    const onboardingState = this.resolveOnboardingState(input.user);
    const defaultTarget =
      (input.mode === 'register' && role === 'student') ||
      (role === 'student' && !onboardingState.completed)
        ? this.buildOnboardingPath(onboardingState.nextStep)
        : this.resolveDashboardPath(role);
    const nextTarget = input.redirectTo ?? defaultTarget;

    if (!input.user.emailVerified) {
      return this.oauthService.buildFrontendUrl({
        frontendOrigin: input.frontendOrigin,
        pathname: '/auth/verify',
        searchParams: {
          email: input.user.email,
          redirect: nextTarget,
        },
      });
    }

    return this.oauthService.buildFrontendUrl({
      frontendOrigin: input.frontendOrigin,
      pathname: nextTarget,
    });
  }

  private buildOnboardingPath(
    nextStep: 'step-1' | 'step-2' | 'step-3' | 'step-4' | null,
    redirectTo?: string | null,
  ) {
    const pathname = `/onboarding/${nextStep ?? 'step-1'}`;

    if (!redirectTo) {
      return pathname;
    }

    const params = new URLSearchParams();
    params.set('redirect', redirectTo);
    return `${pathname}?${params.toString()}`;
  }

  private resolveDashboardPath(role: 'student' | 'teacher' | 'admin') {
    if (role === 'admin') {
      return '/admin/dashboard';
    }

    if (role === 'teacher') {
      return '/teacher/dashboard';
    }

    return '/student/dashboard';
  }

  private resolvePrimaryFrontendRole(
    roles: string[],
  ): 'student' | 'teacher' | 'admin' {
    const normalizedRoles = roles.map((role) => role.trim().toUpperCase());

    if (normalizedRoles.includes('ADMIN')) {
      return 'admin';
    }

    if (normalizedRoles.includes('TEACHER')) {
      return 'teacher';
    }

    return 'student';
  }

  private resolveOnboardingState(user: PublicAuthUser) {
    const role = this.resolvePrimaryFrontendRole(user.roles);
    if (role !== 'student') {
      return {
        completed: true,
        nextStep: null,
      } satisfies {
        completed: boolean;
        nextStep: 'step-1' | 'step-2' | 'step-3' | 'step-4' | null;
      };
    }

    const onboardingProfile = user.onboardingProfile ?? {};
    const stepFields = [
      { slug: 'step-1', fields: ['fullName', 'email', 'primaryLanguage'] },
      { slug: 'step-2', fields: ['currentRole', 'yearsOfExperience', 'dailyCodingTime'] },
      { slug: 'step-3', fields: ['primaryGoal', 'targetStack', 'weeklyCommitment'] },
      {
        slug: 'step-4',
        fields: ['preferredCohortPace', 'mentorInteractionMode', 'timezone'],
      },
    ] as const;

    const allStepsCompleted = stepFields.every((step) =>
      step.fields.every((field) => {
        const value = onboardingProfile[field];
        return typeof value === 'string' && value.trim().length > 0;
      }),
    );
    const completed = Boolean(user.onboardingCompletedAt) || allStepsCompleted;
    const pendingStep = stepFields.find((step) =>
      step.fields.some((field) => {
        const value = onboardingProfile[field];
        return typeof value !== 'string' || value.trim().length === 0;
      }),
    );

    return {
      completed,
      nextStep: completed ? null : (pendingStep?.slug ?? 'step-1'),
    } satisfies {
      completed: boolean;
      nextStep: 'step-1' | 'step-2' | 'step-3' | 'step-4' | null;
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
