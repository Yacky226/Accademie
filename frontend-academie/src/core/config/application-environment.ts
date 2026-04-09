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
    forgotPasswordPath: "/api/auth/forgot-password",
    loginPath: "/api/auth/login",
    logoutAllPath: "/api/auth/logout-all",
    registerPath: "/api/auth/register",
    refreshPath: "/api/auth/refresh",
    resetPasswordPath: "/api/auth/reset-password",
    oauthBasePath: "/api/auth/oauth",
    profilePath: "/api/auth/me",
    logoutPath: "/api/auth/logout",
    verifyEmailPath: "/api/auth/verify-email",
    verifyEmailRequestPath: "/api/auth/verify-email/request",
  },
} as const;

export function buildApiUrl(path: string) {
  if (!appEnvironment.apiBaseUrl) {
    return path;
  }

  return `${appEnvironment.apiBaseUrl}${path}`;
}

export function resolveApiAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  if (!path.startsWith("/")) {
    return path;
  }

  return buildApiUrl(path);
}
