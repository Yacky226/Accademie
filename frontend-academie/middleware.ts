import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_EMAIL_COOKIE,
  SESSION_ROLE_COOKIE,
  SESSION_STATUS_COOKIE,
  SESSION_VERIFIED_COOKIE,
} from "./src/core/auth/session-cookie-store";
import {
  getDashboardPathForRole,
  getRequiredRoleForPath,
  isAuthRoute,
} from "./src/core/router/route-access-control";
import { isUserRole } from "./src/entities/user/model/user-session.types";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionState = request.cookies.get(SESSION_STATUS_COOKIE)?.value;
  const roleValue = request.cookies.get(SESSION_ROLE_COOKIE)?.value;
  const emailValue = request.cookies.get(SESSION_EMAIL_COOKIE)?.value;
  const isVerified = request.cookies.get(SESSION_VERIFIED_COOKIE)?.value === "true";
  const role = isUserRole(roleValue) ? roleValue : null;
  const isAuthenticated = sessionState === "authenticated" && Boolean(role);
  const requiredRole = getRequiredRoleForPath(pathname);

  if (requiredRole && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (requiredRole && isAuthenticated && !isVerified) {
    const verifyUrl = new URL("/auth/verify", request.url);
    verifyUrl.searchParams.set("redirect", `${pathname}${search}`);
    if (emailValue) {
      verifyUrl.searchParams.set("email", emailValue);
    }
    return NextResponse.redirect(verifyUrl);
  }

  if (requiredRole && role !== requiredRole) {
    const fallbackPath = role ? getDashboardPathForRole(role) : "/auth/login";
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  if (isAuthenticated && role && isAuthRoute(pathname)) {
    const authLandingPath = isVerified
      ? getDashboardPathForRole(role)
      : `/auth/verify${emailValue ? `?email=${encodeURIComponent(emailValue)}` : ""}`;
    if (pathname !== "/auth/verify" || isVerified) {
      return NextResponse.redirect(new URL(authLandingPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*", "/auth/:path*"],
};
