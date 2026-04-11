"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import { buildSocialAuthAuthorizationUrl } from "../api/auth-api.client";
import {
  getAuthenticatedLandingPath,
  resolveSafeRedirectTarget,
} from "@/core/router/route-access-control";
import { clearAuthFeedback, loginThunk } from "./auth.slice";
import { useCurrentAuthSession } from "./useCurrentAuthSession";
import type { AuthSocialProvider, LoginFormValues } from "./auth.types";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
  rememberSession: true,
};

export function useLoginFormController() {
  const dispatch = useAuthStoreDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { errorMessage, pendingAction } = useCurrentAuthSession();
  const [values, setValues] = useState<LoginFormValues>(initialValues);

  const isSubmitting = pendingAction === "login";

  function getRequestedRedirectTarget() {
    const candidate = searchParams.get("redirect");

    if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
      return null;
    }

    return candidate;
  }

  function updateField<Key extends keyof LoginFormValues>(
    field: Key,
    value: LoginFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (errorMessage) {
      dispatch(clearAuthFeedback());
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const sessionUser = await dispatch(loginThunk(values)).unwrap();
      const fallbackTarget = getAuthenticatedLandingPath(sessionUser);
      const redirectTarget = resolveSafeRedirectTarget(
        searchParams.get("redirect"),
        fallbackTarget,
      );

      if (!sessionUser.emailVerified) {
        const verificationTarget = new URLSearchParams();
        verificationTarget.set("email", sessionUser.email ?? values.email);
        verificationTarget.set("redirect", redirectTarget);
        router.replace(`/auth/verify?${verificationTarget.toString()}`);
        router.refresh();
        return;
      }

      router.replace(redirectTarget);
      router.refresh();
    } catch {
      // The slice already exposes the backend error to the UI.
    }
  }

  function startSocialAuth(provider: AuthSocialProvider) {
    const authorizationUrl = buildSocialAuthAuthorizationUrl(provider, {
      mode: "login",
      redirect: getRequestedRedirectTarget(),
    });

    window.location.assign(authorizationUrl);
  }

  return {
    errorMessage,
    handleSubmit,
    isSubmitting,
    startSocialAuth,
    updateField,
    values,
  };
}
