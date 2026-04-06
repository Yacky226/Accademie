"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import {
  getDashboardPathForRole,
  resolveSafeRedirectTarget,
} from "@/core/router/route-access-control";
import {
  clearAuthFeedback,
  fetchCurrentSessionThunk,
  requestEmailVerificationThunk,
  verifyEmailThunk,
} from "./auth.slice";
import { useCurrentAuthSession } from "./useCurrentAuthSession";

export function useEmailVerificationController() {
  const dispatch = useAuthStoreDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    actionPreviewUrl,
    emailVerified,
    errorMessage,
    isAuthenticated,
    pendingAction,
    statusMessage,
    user,
  } = useCurrentAuthSession();
  const [email, setEmail] = useState(() => searchParams.get("email")?.trim() ?? "");
  const token = searchParams.get("token")?.trim() ?? "";
  const resolvedEmail = email || user?.email || "";
  const redirectTarget = useMemo(
    () =>
      resolveSafeRedirectTarget(
        searchParams.get("redirect"),
        user ? getDashboardPathForRole(user.role) : "/auth/login",
      ),
    [searchParams, user],
  );

  function updateEmail(nextEmail: string) {
    setEmail(nextEmail);
    if (errorMessage || statusMessage || actionPreviewUrl) {
      dispatch(clearAuthFeedback());
    }
  }

  async function handleRequestLink(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await dispatch(requestEmailVerificationThunk({ email: resolvedEmail }));
  }

  async function handleVerify() {
    if (!token) {
      return;
    }

    try {
      await dispatch(verifyEmailThunk({ token })).unwrap();

      if (isAuthenticated) {
        await dispatch(fetchCurrentSessionThunk()).unwrap();
        router.replace(redirectTarget);
        router.refresh();
      }
    } catch {
      // The slice already exposes the backend error to the UI.
    }
  }

  return {
    email: resolvedEmail,
    emailVerified,
    errorMessage,
    handleRequestLink,
    handleVerify,
    hasToken: Boolean(token),
    isAuthenticated,
    isRequestingLink: pendingAction === "requestEmailVerification",
    isVerifying: pendingAction === "verifyEmail" || pendingAction === "profile",
    previewUrl: actionPreviewUrl,
    redirectTarget,
    statusMessage,
    token,
    updateEmail,
  };
}
