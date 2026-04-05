import type { SessionSnapshot, SessionUser } from "@/entities/user/model/user-session.types";
import { isUserRole } from "@/entities/user/model/user-session.types";

export const SESSION_STATUS_COOKIE = "aa_session_state";
export const SESSION_ROLE_COOKIE = "aa_session_role";
export const SESSION_NAME_COOKIE = "aa_session_name";
export const SESSION_AVATAR_COOKIE = "aa_session_avatar";
export const SESSION_EMAIL_COOKIE = "aa_session_email";
export const SESSION_ID_COOKIE = "aa_session_id";

const SESSION_COOKIE_KEYS = [
  SESSION_STATUS_COOKIE,
  SESSION_ROLE_COOKIE,
  SESSION_NAME_COOKIE,
  SESSION_AVATAR_COOKIE,
  SESSION_EMAIL_COOKIE,
  SESSION_ID_COOKIE,
] as const;

const SESSION_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7;

interface ServerCookieReader {
  get(name: string): { value: string } | undefined;
}

function readCookieValue(rawValue: string | undefined) {
  if (!rawValue) {
    return null;
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function createSessionSnapshot(values: {
  email?: string | null;
  id?: string | null;
  isAuthenticated: boolean;
  name?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
}): SessionSnapshot {
  if (!values.isAuthenticated || !isUserRole(values.role)) {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  return {
    isAuthenticated: true,
    user: {
      id: values.id ?? null,
      email: values.email ?? null,
      name: values.name?.trim() || "Architect Academy",
      role: values.role,
      avatarUrl: values.avatarUrl ?? null,
    },
  };
}

export function readClientSessionCookieSnapshot(): SessionSnapshot {
  if (typeof document === "undefined") {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  const cookieMap = new Map(
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        const name = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
        const value = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : "";
        return [name, value] as const;
      }),
  );

  return createSessionSnapshot({
    avatarUrl: readCookieValue(cookieMap.get(SESSION_AVATAR_COOKIE)),
    email: readCookieValue(cookieMap.get(SESSION_EMAIL_COOKIE)),
    id: readCookieValue(cookieMap.get(SESSION_ID_COOKIE)),
    isAuthenticated: cookieMap.get(SESSION_STATUS_COOKIE) === "authenticated",
    name: readCookieValue(cookieMap.get(SESSION_NAME_COOKIE)),
    role: readCookieValue(cookieMap.get(SESSION_ROLE_COOKIE)),
  });
}

export function readServerSessionCookieSnapshot(
  cookieStore: ServerCookieReader,
): SessionSnapshot {
  return createSessionSnapshot({
    avatarUrl: readCookieValue(cookieStore.get(SESSION_AVATAR_COOKIE)?.value),
    email: readCookieValue(cookieStore.get(SESSION_EMAIL_COOKIE)?.value),
    id: readCookieValue(cookieStore.get(SESSION_ID_COOKIE)?.value),
    isAuthenticated: cookieStore.get(SESSION_STATUS_COOKIE)?.value === "authenticated",
    name: readCookieValue(cookieStore.get(SESSION_NAME_COOKIE)?.value),
    role: readCookieValue(cookieStore.get(SESSION_ROLE_COOKIE)?.value),
  });
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") {
    return;
  }

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

export function writeClientSessionCookies(user: SessionUser) {
  writeCookie(SESSION_STATUS_COOKIE, "authenticated", SESSION_COOKIE_TTL_SECONDS);
  writeCookie(SESSION_ROLE_COOKIE, user.role, SESSION_COOKIE_TTL_SECONDS);
  writeCookie(SESSION_NAME_COOKIE, user.name, SESSION_COOKIE_TTL_SECONDS);

  if (user.avatarUrl) {
    writeCookie(SESSION_AVATAR_COOKIE, user.avatarUrl, SESSION_COOKIE_TTL_SECONDS);
  } else {
    writeCookie(SESSION_AVATAR_COOKIE, "", 0);
  }

  if (user.email) {
    writeCookie(SESSION_EMAIL_COOKIE, user.email, SESSION_COOKIE_TTL_SECONDS);
  } else {
    writeCookie(SESSION_EMAIL_COOKIE, "", 0);
  }

  if (user.id) {
    writeCookie(SESSION_ID_COOKIE, user.id, SESSION_COOKIE_TTL_SECONDS);
  } else {
    writeCookie(SESSION_ID_COOKIE, "", 0);
  }
}

export function clearClientSessionCookies() {
  SESSION_COOKIE_KEYS.forEach((cookieName) => {
    writeCookie(cookieName, "", 0);
  });
}
