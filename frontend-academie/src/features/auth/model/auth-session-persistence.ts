import {
  clearInMemoryAccessToken,
  setInMemoryAccessToken,
} from "@/core/auth/in-memory-access-token-store";
import {
  clearClientSessionCookies,
  writeClientSessionCookies,
} from "@/core/auth/session-cookie-store";
import type { SessionUser } from "@/entities/user/model/user-session.types";
import type { AuthenticatedSession } from "./auth.types";

export function persistAuthenticatedSession(
  session: AuthenticatedSession,
): SessionUser {
  setInMemoryAccessToken(session.accessToken);
  writeClientSessionCookies(session.user);
  return session.user;
}

export function clearPersistedAuthenticatedSession() {
  clearInMemoryAccessToken();
  clearClientSessionCookies();
}
