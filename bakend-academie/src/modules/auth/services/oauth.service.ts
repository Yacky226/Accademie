import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { OAuthStateTokenPayload, TokenService } from './token.service';

export type OAuthProvider = 'google' | 'github';
export type OAuthMode = 'login' | 'register';

export interface OAuthIdentity {
  avatarUrl?: string | null;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
}

export interface OAuthAuthorizationRequest {
  authorizationUrl: string;
  codeVerifier: string;
  frontendOrigin: string | null;
  mode: OAuthMode;
  provider: OAuthProvider;
  redirectTo: string | null;
  role: 'STUDENT' | 'TEACHER';
  state: string;
}

export interface OAuthCallbackContext {
  frontendOrigin: string | null;
  identity: OAuthIdentity;
  mode: OAuthMode;
  provider: OAuthProvider;
  redirectTo: string | null;
  role: 'STUDENT' | 'TEACHER';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function readNullableString(value: unknown) {
  const normalizedValue = readString(value).trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeOAuthMode(value: string | undefined): OAuthMode {
  return value?.trim().toLowerCase() === 'register' ? 'register' : 'login';
}

function normalizeRole(value: string | undefined): 'STUDENT' | 'TEACHER' {
  return value?.trim().toUpperCase() === 'TEACHER' ? 'TEACHER' : 'STUDENT';
}

function sanitizeRedirectTarget(value: string | undefined) {
  if (!value) {
    return null;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

const DEFAULT_ALLOWED_FRONTEND_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;

function buildCodeVerifier() {
  return randomBytes(32).toString('base64url');
}

function buildCodeChallenge(codeVerifier: string) {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return {
      firstName: 'Academie',
      lastName: 'User',
    };
  }

  const [firstName, ...otherParts] = normalized.split(' ');

  return {
    firstName,
    lastName: otherParts.join(' ') || firstName,
  };
}

@Injectable()
export class OAuthService {
  constructor(private readonly tokenService: TokenService) {}

  async createAuthorizationRequest(
    provider: OAuthProvider,
    input: {
      frontendOrigin?: string;
      mode?: string;
      redirectTo?: string;
      role?: string;
    },
  ): Promise<OAuthAuthorizationRequest> {
    const frontendOrigin = this.sanitizeFrontendOrigin(input.frontendOrigin);
    const mode = normalizeOAuthMode(input.mode);
    const role = normalizeRole(input.role);
    const redirectTo = sanitizeRedirectTarget(input.redirectTo);
    const state = await this.tokenService.generateOAuthStateToken({
      frontendOrigin: frontendOrigin ?? undefined,
      provider,
      mode,
      redirectTo: redirectTo ?? undefined,
      role,
    });
    const codeVerifier = buildCodeVerifier();
    const codeChallenge = buildCodeChallenge(codeVerifier);

    return {
      authorizationUrl:
        provider === 'google'
          ? this.buildGoogleAuthorizationUrl({
              codeChallenge,
              mode,
              redirectTo,
              role,
              state,
            })
          : this.buildGitHubAuthorizationUrl({
              codeChallenge,
              mode,
              redirectTo,
              role,
              state,
            }),
      codeVerifier,
      frontendOrigin,
      mode,
      provider,
      redirectTo,
      role,
      state,
    };
  }

  async resolveCallback(
    provider: OAuthProvider,
    input: {
      code: string;
      codeVerifier: string;
      state: string;
    },
  ): Promise<OAuthCallbackContext> {
    const statePayload = await this.tokenService.verifyOAuthStateToken(
      input.state,
    );

    if (statePayload.provider !== provider) {
      throw new UnauthorizedException('OAuth provider mismatch');
    }

    if (!input.code.trim()) {
      throw new BadRequestException('Missing OAuth authorization code');
    }

    if (!input.codeVerifier.trim()) {
      throw new UnauthorizedException('Missing OAuth code verifier');
    }

    return {
      frontendOrigin: statePayload.frontendOrigin ?? null,
      identity:
        provider === 'google'
          ? await this.exchangeGoogleCode(input.code, input.codeVerifier)
          : await this.exchangeGitHubCode(input.code, input.codeVerifier),
      mode: statePayload.mode,
      provider,
      redirectTo: statePayload.redirectTo ?? null,
      role: statePayload.role,
    };
  }

  async readStateToken(
    stateToken: string,
  ): Promise<OAuthStateTokenPayload | null> {
    try {
      return await this.tokenService.verifyOAuthStateToken(stateToken);
    } catch {
      return null;
    }
  }

  buildFrontendCallbackUrl(input: {
    frontendOrigin?: string | null;
    provider: OAuthProvider;
    mode?: OAuthMode;
    redirectTo?: string | null;
    errorMessage?: string | null;
  }) {
    const callbackUrl = new URL(
      '/auth/oauth/callback',
      this.resolveFrontendOrigin(input.frontendOrigin),
    );

    callbackUrl.searchParams.set('provider', input.provider);

    if (input.mode) {
      callbackUrl.searchParams.set('mode', input.mode);
    }

    if (input.redirectTo) {
      callbackUrl.searchParams.set('redirect', input.redirectTo);
    }

    if (input.errorMessage) {
      callbackUrl.searchParams.set('error', 'oauth_failed');
      callbackUrl.searchParams.set('message', input.errorMessage);
    }

    return callbackUrl.toString();
  }

  buildFrontendUrl(input: {
    frontendOrigin?: string | null;
    pathname: string;
    searchParams?: Record<string, string | null | undefined>;
  }) {
    const targetUrl = new URL(
      input.pathname,
      this.resolveFrontendOrigin(input.frontendOrigin),
    );

    Object.entries(input.searchParams ?? {}).forEach(([key, value]) => {
      if (!value) {
        return;
      }

      targetUrl.searchParams.set(key, value);
    });

    return targetUrl.toString();
  }

  private buildGoogleAuthorizationUrl(input: {
    codeChallenge: string;
    mode: OAuthMode;
    redirectTo: string | null;
    role: 'STUDENT' | 'TEACHER';
    state: string;
  }) {
    const config = this.getGoogleConfig();
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', this.buildProviderCallbackUri('google'));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', input.state);
    url.searchParams.set('prompt', 'select_account');
    url.searchParams.set('code_challenge', input.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return url.toString();
  }

  private buildGitHubAuthorizationUrl(input: {
    codeChallenge: string;
    mode: OAuthMode;
    redirectTo: string | null;
    role: 'STUDENT' | 'TEACHER';
    state: string;
  }) {
    const config = this.getGitHubConfig();
    const url = new URL('https://github.com/login/oauth/authorize');

    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', this.buildProviderCallbackUri('github'));
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', input.state);
    url.searchParams.set(
      'allow_signup',
      input.mode === 'register' ? 'true' : 'false',
    );
    url.searchParams.set('prompt', 'select_account');
    url.searchParams.set('code_challenge', input.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return url.toString();
  }

  private async exchangeGoogleCode(
    code: string,
    codeVerifier: string,
  ): Promise<OAuthIdentity> {
    const config = this.getGoogleConfig();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: this.buildProviderCallbackUri('google'),
      }),
    });
    const tokenPayload = await this.readProviderPayload(
      tokenResponse,
      'Google',
    );
    const tokenData = isRecord(tokenPayload) ? tokenPayload : {};
    const accessToken = readString(tokenData.access_token);

    if (!accessToken) {
      throw new UnauthorizedException(
        'Google did not return an access token',
      );
    }

    const userInfoResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const userInfoPayload = await this.readProviderPayload(
      userInfoResponse,
      'Google',
    );
    const userInfoData = isRecord(userInfoPayload) ? userInfoPayload : {};

    const email = readString(userInfoData.email).trim().toLowerCase();
    const emailVerified = Boolean(userInfoData.email_verified);
    const fullName =
      readString(userInfoData.name) || email.split('@')[0] || 'Academie';
    const nameParts = splitFullName(fullName);

    if (!email || !emailVerified) {
      throw new UnauthorizedException(
        'Google account must expose a verified email address',
      );
    }

    return {
      avatarUrl: readNullableString(userInfoData.picture),
      email,
      emailVerified,
      firstName:
        readString(userInfoData.given_name).trim() || nameParts.firstName,
      lastName:
        readString(userInfoData.family_name).trim() || nameParts.lastName,
    };
  }

  private async exchangeGitHubCode(
    code: string,
    codeVerifier: string,
  ): Promise<OAuthIdentity> {
    const config = this.getGitHubConfig();
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          code_verifier: codeVerifier,
          redirect_uri: this.buildProviderCallbackUri('github'),
        }),
      },
    );
    const tokenPayload = await this.readProviderPayload(
      tokenResponse,
      'GitHub',
    );
    const tokenData = isRecord(tokenPayload) ? tokenPayload : {};
    const accessToken = readString(tokenData.access_token);

    if (!accessToken) {
      throw new UnauthorizedException(
        'GitHub did not return an access token',
      );
    }

    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Academie',
    };

    const profileResponse = await fetch('https://api.github.com/user', {
      headers,
    });
    const profilePayload = await this.readProviderPayload(
      profileResponse,
      'GitHub',
    );
    const profileData = isRecord(profilePayload) ? profilePayload : {};

    let email = readString(profileData.email).trim().toLowerCase();

    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers,
      });
      const emailsPayload = await this.readProviderPayload(
        emailsResponse,
        'GitHub',
      );

      if (Array.isArray(emailsPayload)) {
        const primaryVerifiedEmail =
          emailsPayload.find(
            (item) =>
              isRecord(item) &&
              item.primary === true &&
              item.verified === true &&
              typeof item.email === 'string',
          ) ??
          emailsPayload.find(
            (item) =>
              isRecord(item) &&
              item.verified === true &&
              typeof item.email === 'string',
          );

        email = readString(
          isRecord(primaryVerifiedEmail) ? primaryVerifiedEmail.email : '',
        )
          .trim()
          .toLowerCase();
      }
    }

    if (!email) {
      throw new UnauthorizedException(
        'GitHub account must expose a verified email address',
      );
    }

    const fullName =
      readString(profileData.name) ||
      readString(profileData.login) ||
      email.split('@')[0] ||
      'Academie';
    const nameParts = splitFullName(fullName);

    return {
      avatarUrl: readNullableString(profileData.avatar_url),
      email,
      emailVerified: true,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
    };
  }

  private async readProviderPayload(
    response: Response,
    providerName: 'Google' | 'GitHub',
  ) {
    const rawPayload = await response.text();
    const parsedPayload = rawPayload.trim()
      ? this.parsePayload(rawPayload)
      : null;

    if (response.ok) {
      return parsedPayload;
    }

    let errorMessage = `${providerName} authentication failed`;

    if (isRecord(parsedPayload)) {
      errorMessage =
        readString(parsedPayload.error_description) ||
        readString(parsedPayload.error) ||
        readString(parsedPayload.message) ||
        errorMessage;
    }

    throw new UnauthorizedException(errorMessage);
  }

  private parsePayload(rawPayload: string): unknown {
    try {
      return JSON.parse(rawPayload) as unknown;
    } catch {
      return rawPayload;
    }
  }

  private buildProviderCallbackUri(provider: OAuthProvider) {
    const apiPrefix = process.env.API_PREFIX ?? 'api';
    return new URL(
      `/${apiPrefix}/auth/oauth/${provider}/callback`,
      this.resolveApiOrigin(),
    ).toString();
  }

  private resolveFrontendOrigin(frontendOrigin?: string | null) {
    return (
      this.sanitizeFrontendOrigin(frontendOrigin ?? undefined) ??
      this.resolveAllowedFrontendOrigins()[0] ??
      'http://localhost:3000'
    );
  }

  private sanitizeFrontendOrigin(value: string | undefined) {
    if (!value?.trim()) {
      return null;
    }

    try {
      const parsedValue = new URL(value.trim());
      if (
        (parsedValue.protocol !== 'http:' && parsedValue.protocol !== 'https:') ||
        !this.resolveAllowedFrontendOrigins().includes(parsedValue.origin)
      ) {
        return null;
      }

      return parsedValue.origin;
    } catch {
      return null;
    }
  }

  private resolveAllowedFrontendOrigins() {
    const configuredOrigins = (process.env.FRONTEND_APP_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    return Array.from(
      new Set([...configuredOrigins, ...DEFAULT_ALLOWED_FRONTEND_ORIGINS]),
    );
  }

  private resolveApiOrigin() {
    if (process.env.API_PUBLIC_ORIGIN?.trim()) {
      return process.env.API_PUBLIC_ORIGIN.trim();
    }

    return `http://localhost:${process.env.PORT ?? '3001'}`;
  }

  private getGoogleConfig() {
    const clientId = process.env.OAUTH_GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.OAUTH_GOOGLE_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Google OAuth is not configured',
      );
    }

    return { clientId, clientSecret };
  }

  private getGitHubConfig() {
    const clientId = process.env.OAUTH_GITHUB_CLIENT_ID?.trim();
    const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'GitHub OAuth is not configured',
      );
    }

    return { clientId, clientSecret };
  }
}
