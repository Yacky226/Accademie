"use client";

import { useAppSelector } from "@/core/store/app-store-hooks";
import { getDashboardPathForRole } from "@/core/router/route-access-control";
import { formatUserRoleLabel } from "@/entities/user/model/user-session.types";
import {
  selectAuthError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectPendingAuthAction,
} from "./auth.selectors";

export function useCurrentAuthSession() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const errorMessage = useAppSelector(selectAuthError);
  const pendingAction = useAppSelector(selectPendingAuthAction);

  return {
    dashboardHref: user ? getDashboardPathForRole(user.role) : "/auth/login",
    errorMessage,
    isAuthenticated,
    pendingAction,
    roleLabel: user ? formatUserRoleLabel(user.role) : null,
    user,
  };
}
