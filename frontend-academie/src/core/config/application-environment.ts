const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "");

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const appEnvironment = {
  apiBaseUrl: trimTrailingSlash(DEFAULT_API_BASE_URL),
  auth: {
    loginPath: "/api/auth/login",
    registerPath: "/api/auth/register",
    refreshPath: "/api/auth/refresh",
    profilePath: "/api/auth/me",
    logoutPath: "/api/auth/logout",
  },
} as const;

export function buildApiUrl(path: string) {
  if (!appEnvironment.apiBaseUrl) {
    return path;
  }

  return `${appEnvironment.apiBaseUrl}${path}`;
}
