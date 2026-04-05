"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/core/store/app-store-hooks";
import { getDashboardPathForRole } from "@/core/router/route-access-control";
import { clearAuthError, registerThunk } from "./auth.slice";
import { useCurrentAuthSession } from "./useCurrentAuthSession";
import type { RegisterFormValues } from "./auth.types";

const initialValues: RegisterFormValues = {
  acceptTerms: false,
  email: "",
  fullName: "",
  password: "",
  role: "student",
};

export function useRegisterFormController() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { errorMessage, pendingAction } = useCurrentAuthSession();
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const isSubmitting = pendingAction === "register";

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
      dispatch(clearAuthError());
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

      if (sessionUser.role === "student") {
        router.replace("/onboarding/step-1");
        router.refresh();
        return;
      }

      router.replace(getDashboardPathForRole(sessionUser.role));
      router.refresh();
    } catch {
      // The slice already exposes the backend error to the UI.
    }
  }

  return {
    errorMessage: validationMessage ?? errorMessage,
    handleSubmit,
    isSubmitting,
    updateField,
    values,
  };
}
