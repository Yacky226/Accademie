"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import { buildSocialAuthAuthorizationUrl } from "../api/auth-api.client";
import { getDashboardPathForRole } from "@/core/router/route-access-control";
import { clearAuthFeedback, registerThunk } from "./auth.slice";
import { useCurrentAuthSession } from "./useCurrentAuthSession";
import type { AuthSocialProvider, RegisterFormValues } from "./auth.types";

type PasswordStrength = {
  activeBars: number;
  hint: string;
  label: string;
  tone: "idle" | "medium" | "strong" | "weak";
};

const initialValues: RegisterFormValues = {
  acceptTerms: false,
  email: "",
  fullName: "",
  password: "",
  role: "student",
};

function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      activeBars: 0,
      hint: "Use at least 8 characters, plus uppercase, number and symbol.",
      label: "Empty",
      tone: "idle",
    };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  }

  if (/\d/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) {
    score += 1;
  }

  if (score <= 1) {
    return {
      activeBars: 1,
      hint: "Add uppercase letters, numbers or symbols to strengthen it.",
      label: "Weak",
      tone: "weak",
    };
  }

  if (score === 2) {
    return {
      activeBars: 2,
      hint: "Good start. Add a number or a symbol to make it safer.",
      label: "Fair",
      tone: "medium",
    };
  }

  if (score === 3) {
    return {
      activeBars: 3,
      hint: "Almost there. A symbol or a longer phrase will improve it.",
      label: "Good",
      tone: "medium",
    };
  }

  return {
    activeBars: 4,
    hint: "Strong password. It is long enough and mixes several character types.",
    label: "Strong",
    tone: "strong",
  };
}

export function useRegisterFormController() {
  const dispatch = useAuthStoreDispatch();
  const router = useRouter();
  const { errorMessage, pendingAction } = useCurrentAuthSession();
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const isSubmitting = pendingAction === "register";
  const passwordStrength = evaluatePasswordStrength(values.password);

  function resolvePostRegistrationRedirect() {
    return values.role === "student"
      ? "/onboarding/step-1"
      : getDashboardPathForRole(values.role);
  }

  function updateField<Key extends keyof RegisterFormValues>(
    field: Key,
    value: RegisterFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (validationMessage) {
      setValidationMessage(null);
    }

    if (errorMessage) {
      dispatch(clearAuthFeedback());
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.acceptTerms) {
      setValidationMessage("You need to accept the platform terms before creating an account.");
      return;
    }

    if (values.password.trim().length < 8) {
      setValidationMessage("Use at least 8 characters to keep the account secure.");
      return;
    }

    try {
      const sessionUser = await dispatch(registerThunk(values)).unwrap();
      const postVerificationTarget =
        sessionUser.role === "student"
          ? "/onboarding/step-1"
          : getDashboardPathForRole(sessionUser.role);

      if (!sessionUser.emailVerified) {
        const verificationTarget = new URLSearchParams();
        verificationTarget.set("email", sessionUser.email ?? values.email);
        verificationTarget.set("redirect", postVerificationTarget);
        router.replace(`/auth/verify?${verificationTarget.toString()}`);
        router.refresh();
        return;
      }

      router.replace(postVerificationTarget);
      router.refresh();
    } catch {
      // The slice already exposes the backend error to the UI.
    }
  }

  function startSocialAuth(provider: AuthSocialProvider) {
    if (!values.acceptTerms) {
      setValidationMessage("You need to accept the platform terms before continuing with Google or GitHub.");
      return;
    }

    const authorizationUrl = buildSocialAuthAuthorizationUrl(provider, {
      mode: "register",
      redirect: resolvePostRegistrationRedirect(),
      role: values.role,
    });

    window.location.assign(authorizationUrl);
  }

  return {
    errorMessage: validationMessage ?? errorMessage,
    handleSubmit,
    isSubmitting,
    passwordStrength,
    startSocialAuth,
    updateField,
    values,
  };
}
