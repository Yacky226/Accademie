"use client";

import { useAuthStoreSelector } from "@/core/store/auth-store-hooks";
import { getAuthenticatedLandingPath } from "@/core/router/route-access-control";
import { formatUserRoleLabel } from "@/entities/user/model/user-session.types";
import {
  selectAuthActionPreviewToken,
  selectAuthActionPreviewUrl,
  selectAuthError,
  selectAuthStatusMessage,
  selectCurrentUser,
  selectIsAuthenticated,
  selectPendingAuthAction,
} from "./auth.selectors";

export function useCurrentAuthSession() {
  const isAuthenticated = useAuthStoreSelector(selectIsAuthenticated);
  const user = useAuthStoreSelector(selectCurrentUser);
  const errorMessage = useAuthStoreSelector(selectAuthError);
  const statusMessage = useAuthStoreSelector(selectAuthStatusMessage);
  const actionPreviewUrl = useAuthStoreSelector(selectAuthActionPreviewUrl);
  const actionPreviewToken = useAuthStoreSelector(selectAuthActionPreviewToken);
  const pendingAction = useAuthStoreSelector(selectPendingAuthAction);

  return {
    actionPreviewToken,
    actionPreviewUrl,
    dashboardHref: user
      ? user.emailVerified
        ? getAuthenticatedLandingPath(user)
        : `/auth/verify${user.email ? `?email=${encodeURIComponent(user.email)}` : ""}`
      : "/auth/login",
    errorMessage,
    emailVerified: user?.emailVerified ?? false,
    isAuthenticated,
    pendingAction,
    roleLabel: user ? formatUserRoleLabel(user.role) : null,
    statusMessage,
    user,
  };
}
