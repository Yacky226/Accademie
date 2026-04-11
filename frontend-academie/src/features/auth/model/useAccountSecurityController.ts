"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import { getAuthenticatedLandingPath } from "@/core/router/route-access-control";
import { formatUserRoleLabel } from "@/entities/user/model/user-session.types";
import {
  logoutAllSessionsThunk,
  requestEmailVerificationThunk,
} from "./auth.slice";
import { useCurrentAuthSession } from "./useCurrentAuthSession";

export function useAccountSecurityController() {
  const dispatch = useAuthStoreDispatch();
  const router = useRouter();
  const [isRedirecting, startTransition] = useTransition();
  const {
    actionPreviewUrl,
    emailVerified,
    errorMessage,
    pendingAction,
    statusMessage,
    user,
  } = useCurrentAuthSession();

  const verificationRedirectTarget = user
    ? getAuthenticatedLandingPath(user)
    : "/auth/login";

  const verificationHref = user?.email
    ? `/auth/verify?email=${encodeURIComponent(user.email)}&redirect=${encodeURIComponent(verificationRedirectTarget)}`
    : "/auth/verify";

  const isRequestingVerification = pendingAction === "requestEmailVerification";
  const isClosingAllSessions = pendingAction === "logoutAll" || isRedirecting;

  async function handleSendVerificationLink() {
    if (!user?.email || emailVerified) {
      return;
    }

    await dispatch(requestEmailVerificationThunk({ email: user.email }));
  }

  async function handleLogoutAllSessions() {
    await dispatch(logoutAllSessionsThunk());

    startTransition(() => {
      router.replace("/auth/login");
      router.refresh();
    });
  }

  return {
    emailVerified,
    errorMessage,
    handleLogoutAllSessions,
    handleSendVerificationLink,
    isClosingAllSessions,
    isRequestingVerification,
    previewUrl: actionPreviewUrl,
    roleLabel: user ? formatUserRoleLabel(user.role) : null,
    statusMessage,
    user,
    verificationHref,
  };
}
