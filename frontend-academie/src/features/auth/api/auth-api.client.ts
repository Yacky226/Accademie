import { appEnvironment } from "@/core/config/application-environment";
import { getInMemoryAccessToken } from "@/core/auth/in-memory-access-token-store";
import {
  isUserRole,
  type SessionUser,
  type UserRole,
} from "@/entities/user/model/user-session.types";
import { isApiClientError, requestApiJson } from "@/core/api/api-http-client";
import type {
  AuthRequestContext,
  AuthenticatedSession,
  LoginCredentials,
  RegisterPayload,
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
    avatarUrl:
      (typeof source.avatarUrl === "string" && source.avatarUrl) ||
      (typeof source.avatar === "string" && source.avatar) ||
      null,
    email: (typeof source.email === "string" && source.email) || context.email || null,
    id:
      (typeof source.id === "string" && source.id) ||
      (typeof source.id === "number" && String(source.id)) ||
      null,
    name: nameCandidate,
    role: toUserRole(roleCandidate, context.fallbackRole ?? "student"),
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
        role: payload.role,
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

export async function requestCurrentSession() {
  const accessToken = getInMemoryAccessToken();

  if (!accessToken) {
    return requestSessionRefresh();
  }

  try {
    return await requestSessionProfile(accessToken);
  } catch (error) {
    if (!isApiClientError(error) || error.status !== 401) {
      throw error;
    }

    return requestSessionRefresh();
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
