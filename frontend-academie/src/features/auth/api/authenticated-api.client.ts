import {
  clearInMemoryAccessToken,
  getInMemoryAccessToken,
  setInMemoryAccessToken,
} from "@/core/auth/in-memory-access-token-store";
import {
  clearClientSessionCookies,
  writeClientSessionCookies,
} from "@/core/auth/session-cookie-store";
import { isApiClientError, requestApiJson } from "@/core/api/api-http-client";
import type { AuthRequestContext } from "../model/auth.types";
import { requestSessionRefresh } from "./auth-api.client";

async function refreshAuthenticatedSession(context: AuthRequestContext = {}) {
  try {
    const session = await requestSessionRefresh(context);
    setInMemoryAccessToken(session.accessToken);
    writeClientSessionCookies(session.user);
    return session.accessToken;
  } catch (error) {
    clearInMemoryAccessToken();
    clearClientSessionCookies();
    throw error;
  }
}

export async function ensureAuthenticatedAccessToken(
  context: AuthRequestContext = {},
) {
  const accessToken = getInMemoryAccessToken();
  if (accessToken) {
    return accessToken;
  }

  return refreshAuthenticatedSession(context);
}

export async function requestAuthenticatedApiJson<TResponse>(
  path: string,
  options: RequestInit,
  fallbackMessage: string,
  context: AuthRequestContext = {},
) {
  async function performRequest(accessToken: string) {
    return requestApiJson<TResponse>(
      path,
      {
        ...options,
        headers: {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        },
      },
      fallbackMessage,
    );
  }

  let accessToken = await ensureAuthenticatedAccessToken(context);

  try {
    return await performRequest(accessToken);
  } catch (error) {
    if (!isApiClientError(error) || error.status !== 401) {
      throw error;
    }

    accessToken = await refreshAuthenticatedSession(context);
    return performRequest(accessToken);
  }
}
