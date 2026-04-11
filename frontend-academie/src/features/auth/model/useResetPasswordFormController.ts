"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import {
  getAuthenticatedLandingPath,
  resolveSafeRedirectTarget,
} from "@/core/router/route-access-control";
import {
  clearAuthFeedback,
  resetPasswordThunk,
} from "./auth.slice";
import { useCurrentAuthSession } from "./useCurrentAuthSession";

interface ResetPasswordFormState {
  confirmPassword: string;
  password: string;
  rememberSession: boolean;
}

const initialState: ResetPasswordFormState = {
  confirmPassword: "",
  password: "",
  rememberSession: true,
};

export function useResetPasswordFormController() {
  const dispatch = useAuthStoreDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    errorMessage,
    pendingAction,
    statusMessage,
  } = useCurrentAuthSession();
  const [values, setValues] = useState(initialState);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const token = searchParams.get("token")?.trim() ?? "";
  const isSubmitting = pendingAction === "resetPassword";

  function updateField<Key extends keyof ResetPasswordFormState>(
    field: Key,
    value: ResetPasswordFormState[Key],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (validationMessage) {
      setValidationMessage(null);
    }

    if (errorMessage || statusMessage) {
      dispatch(clearAuthFeedback());
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setValidationMessage("This password reset link is missing its security token.");
      return;
    }

    if (values.password.trim().length < 8) {
      setValidationMessage("Use at least 8 characters for the new password.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      setValidationMessage("The password confirmation does not match.");
      return;
    }

    try {
      const sessionUser = await dispatch(
        resetPasswordThunk({
          password: values.password,
          rememberSession: values.rememberSession,
          token,
        }),
      ).unwrap();

      const redirectTarget = resolveSafeRedirectTarget(
        searchParams.get("redirect"),
        getAuthenticatedLandingPath(sessionUser),
      );

      if (!sessionUser.emailVerified) {
        const verificationTarget = new URLSearchParams();
        verificationTarget.set("email", sessionUser.email ?? "");
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

  return {
    errorMessage: validationMessage ?? errorMessage,
    handleSubmit,
    hasToken: Boolean(token),
    isSubmitting,
    statusMessage,
    token,
    updateField,
    values,
  };
}
