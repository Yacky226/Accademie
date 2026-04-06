import type {
  SessionSnapshot,
  UserRole,
} from "@/entities/user/model/user-session.types";

const AUTH_ROUTES = [
  "/auth",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify",
] as const;

export function getDashboardPathForRole(role: UserRole) {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "teacher") {
    return "/teacher/dashboard";
  }

  return "/student/dashboard";
}

export function getRequiredRoleForPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  if (pathname.startsWith("/teacher")) {
    return "teacher";
  }

  if (pathname.startsWith("/student")) {
    return "student";
  }

  return null;
}

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isProtectedWorkspaceRoute(pathname: string) {
  return getRequiredRoleForPath(pathname) !== null;
}

export function resolveAuthorizedPath(pathname: string, session: SessionSnapshot) {
  const requiredRole = getRequiredRoleForPath(pathname);

  if (!requiredRole) {
    return true;
  }

  return session.isAuthenticated && session.user?.role === requiredRole;
}

export function resolveSafeRedirectTarget(
  candidate: string | null | undefined,
  fallbackPath: string,
) {
  if (!candidate) {
    return fallbackPath;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallbackPath;
  }

  return candidate;
}
