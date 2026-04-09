import {
  appEnvironment,
  buildApiUrl,
  resolveApiAssetUrl,
} from "@/core/config/application-environment";
import { getInMemoryAccessToken } from "@/core/auth/in-memory-access-token-store";
import {
  isUserRole,
  type SessionUser,
  type UserRole,
} from "@/entities/user/model/user-session.types";
import { isApiClientError, requestApiJson } from "@/core/api/api-http-client";
import type {
  AuthActionFeedback,
  AuthRequestContext,
  AuthenticatedSession,
  RequestEmailVerificationPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  LoginCredentials,
  RegisterPayload,
  VerifyEmailPayload,
  AuthSocialProvider,
} from "../model/auth.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractData(payload: unknown) {
  if (!isRecord(payload)) {
    return {};
  }

  if (isRecord(payload.data)) {
    return payload.data;
  }

  return payload;
}

function toUserRole(value: unknown, fallbackRole: UserRole = "student"): UserRole {
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (isUserRole(normalizedValue)) {
      return normalizedValue;
    }
  }

  return fallbackRole;
}

function fallbackName(email: string | undefined, fullName: string | undefined) {
  if (fullName?.trim()) {
    return fullName.trim();
  }

  if (email?.includes("@")) {
    return email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Architect Academy";
  }

  return "Architect Academy";
}

function mapSessionUser(payload: unknown, context: AuthRequestContext = {}): SessionUser {
  const data = extractData(payload);
  const source = isRecord(data.user)
    ? data.user
    : isRecord(data.account)
      ? data.account
      : isRecord(data.profile)
        ? data.profile
        : isRecord(data)
          ? data
          : {};

  const nameCandidate =
    (typeof source.fullName === "string" && source.fullName) ||
    (typeof source.name === "string" && source.name) ||
    fallbackName(context.email, context.fullName);

  const rolesCandidate = Array.isArray(source.roles)
    ? source.roles.find((value): value is string => typeof value === "string")
    : Array.isArray(data.roles)
      ? data.roles.find((value): value is string => typeof value === "string")
      : undefined;

  const roleCandidate =
    rolesCandidate ||
    (typeof source.role === "string" && source.role) ||
    (typeof data.role === "string" && data.role) ||
    context.fallbackRole;

  return {
    avatarUrl: resolveApiAssetUrl(
      (typeof source.avatarUrl === "string" && source.avatarUrl) ||
        (typeof source.avatar === "string" && source.avatar) ||
        null,
    ),
    email: (typeof source.email === "string" && source.email) || context.email || null,
    id:
      (typeof source.id === "string" && source.id) ||
      (typeof source.id === "number" && String(source.id)) ||
      null,
    name: nameCandidate,
    role: toUserRole(roleCandidate, context.fallbackRole ?? "student"),
    emailVerified:
      (typeof source.emailVerified === "boolean" && source.emailVerified) ||
      (typeof data.emailVerified === "boolean" && data.emailVerified) ||
      false,
  };
}

function mapActionFeedback(payload: unknown, fallbackMessage: string): AuthActionFeedback {
  const data = extractData(payload);

  return {
    message:
      (typeof data.message === "string" && data.message) ||
      (typeof data.status === "string" && data.status) ||
      fallbackMessage,
    previewToken:
      (typeof data.previewToken === "string" && data.previewToken) ||
      null,
    previewUrl:
      (typeof data.previewUrl === "string" && data.previewUrl) ||
      null,
  };
}

function extractAccessToken(payload: unknown) {
  const data = extractData(payload);
  const tokens = isRecord(data.tokens) ? data.tokens : {};

  const tokenCandidate =
    (typeof tokens.accessToken === "string" && tokens.accessToken) ||
    (typeof data.accessToken === "string" && data.accessToken);

  if (!tokenCandidate) {
    throw new Error("Authentication succeeded but the backend did not return an access token.");
  }

  return tokenCandidate;
}

let pendingSessionRefreshPromise: Promise<AuthenticatedSession> | null = null;

function mapAuthenticatedSession(
  payload: unknown,
  context: AuthRequestContext = {},
): AuthenticatedSession {
  return {
    accessToken: extractAccessToken(payload),
    user: mapSessionUser(payload, context),
  };
}

async function requestSessionProfile(accessToken: string) {
  const payload = await requestApiJson<unknown>(
    appEnvironment.auth.profilePath,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    "Unable to verify the current session.",
  );

  return {
    accessToken,
    user: mapSessionUser(payload),
  } satisfies AuthenticatedSession;
}

export async function requestLoginSession(credentials: LoginCredentials) {
  const payload = await requestApiJson<unknown>(
    appEnvironment.auth.loginPath,
    {
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        rememberSession: credentials.rememberSession,
      }),
      method: "POST",
    },
    "Unable to sign in. Please verify your credentials.",
  );

  return mapAuthenticatedSession(payload, {
    email: credentials.email,
  });
}

export async function requestRegistrationSession(payload: RegisterPayload) {
  const response = await requestApiJson<unknown>(
    appEnvironment.auth.registerPath,
    {
      body: JSON.stringify({
        email: payload.email,
        fullName: payload.fullName,
        password: payload.password,
        role: payload.role.toUpperCase(),
      }),
      method: "POST",
    },
    "Unable to create your account right now.",
  );

  return mapAuthenticatedSession(response, {
    email: payload.email,
    fallbackRole: payload.role,
    fullName: payload.fullName,
  });
}

export async function requestSessionRefresh(context: AuthRequestContext = {}) {
  const payload = await requestApiJson<unknown>(
    appEnvironment.auth.refreshPath,
    {
      method: "POST",
    },
    "Your session expired. Please sign in again.",
  );

  return mapAuthenticatedSession(payload, context);
}

export async function requestSharedSessionRefresh(
  context: AuthRequestContext = {},
) {
  if (!pendingSessionRefreshPromise) {
    pendingSessionRefreshPromise = requestSessionRefresh(context).finally(() => {
      pendingSessionRefreshPromise = null;
    });
  }

  return pendingSessionRefreshPromise;
}

export async function requestCurrentSession() {
  const accessToken = getInMemoryAccessToken();

  if (!accessToken) {
    return requestSharedSessionRefresh();
  }

  try {
    return await requestSessionProfile(accessToken);
  } catch (error) {
    if (!isApiClientError(error) || error.status !== 401) {
      throw error;
    }

    return requestSharedSessionRefresh();
  }
}

export async function requestSessionLogout() {
  try {
    await requestApiJson<unknown>(
      appEnvironment.auth.logoutPath,
      {
        method: "POST",
      },
      "Unable to close the current session.",
    );
  } catch (error) {
    if (isApiClientError(error) && error.status === 401) {
      return;
    }

    throw error;
  }
}

export async function requestLogoutAllSessions() {
  async function performRequest(accessToken: string) {
    return requestApiJson<unknown>(
      appEnvironment.auth.logoutAllPath,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      "Unable to close your active sessions.",
    );
  }

  let accessToken = getInMemoryAccessToken();
  if (!accessToken) {
    accessToken = (await requestSharedSessionRefresh()).accessToken;
  }

  try {
    await performRequest(accessToken);
  } catch (error) {
    if (!isApiClientError(error) || error.status !== 401) {
      throw error;
    }

    accessToken = (await requestSharedSessionRefresh()).accessToken;
    await performRequest(accessToken);
  }
}

export async function requestPasswordResetLink(payload: RequestPasswordResetPayload) {
  const response = await requestApiJson<unknown>(
    appEnvironment.auth.forgotPasswordPath,
    {
      body: JSON.stringify({
        email: payload.email,
      }),
      method: "POST",
    },
    "Unable to start the password reset flow right now.",
  );

  return mapActionFeedback(
    response,
    "If the account exists, a password reset link has been prepared.",
  );
}

export async function requestPasswordResetCompletion(payload: ResetPasswordPayload) {
  const response = await requestApiJson<unknown>(
    appEnvironment.auth.resetPasswordPath,
    {
      body: JSON.stringify({
        token: payload.token,
        password: payload.password,
        rememberSession: payload.rememberSession,
      }),
      method: "POST",
    },
    "Unable to reset the password right now.",
  );

  return mapAuthenticatedSession(response);
}

export async function requestEmailVerificationLink(
  payload: RequestEmailVerificationPayload,
) {
  const response = await requestApiJson<unknown>(
    appEnvironment.auth.verifyEmailRequestPath,
    {
      body: JSON.stringify({
        email: payload.email,
      }),
      method: "POST",
    },
    "Unable to prepare a verification link right now.",
  );

  return mapActionFeedback(
    response,
    "If the account exists, a verification link has been prepared.",
  );
}

export async function requestEmailVerificationConfirmation(
  payload: VerifyEmailPayload,
) {
  const response = await requestApiJson<unknown>(
    appEnvironment.auth.verifyEmailPath,
    {
      body: JSON.stringify({
        token: payload.token,
      }),
      method: "POST",
    },
    "Unable to verify this email address right now.",
  );

  return mapActionFeedback(response, "Your email address has been verified successfully.");
}

function sanitizeRelativeRedirectTarget(candidate: string | null | undefined) {
  if (!candidate) {
    return null;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return null;
  }

  return candidate;
}

export function buildSocialAuthAuthorizationUrl(
  provider: AuthSocialProvider,
  options: {
    mode: "login" | "register";
    redirect?: string | null;
    role?: "student" | "teacher";
  },
) {
  const params = new URLSearchParams();

  params.set("mode", options.mode);

  const redirect = sanitizeRelativeRedirectTarget(options.redirect);
  if (redirect) {
    params.set("redirect", redirect);
  }

  if (options.role) {
    params.set("role", options.role);
  }

  if (typeof window !== "undefined" && /^https?:$/.test(window.location.protocol)) {
    params.set("frontend", window.location.origin);
  }

  return buildApiUrl(`${appEnvironment.auth.oauthBasePath}/${provider}?${params.toString()}`);
}
