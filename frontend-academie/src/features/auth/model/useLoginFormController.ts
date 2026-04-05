"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/core/store/app-store-hooks";
import {
  getDashboardPathForRole,
  resolveSafeRedirectTarget,
} from "@/core/router/route-access-control";
import { clearAuthError, loginThunk } from "./auth.slice";
import { useCurrentAuthSession } from "./useCurrentAuthSession";
import type { LoginFormValues } from "./auth.types";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
  rememberSession: true,
};

export function useLoginFormController() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { errorMessage, pendingAction } = useCurrentAuthSession();
  const [values, setValues] = useState<LoginFormValues>(initialValues);

  const isSubmitting = pendingAction === "login";

  function updateField<Key extends keyof LoginFormValues>(
    field: Key,
    value: LoginFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (errorMessage) {
      dispatch(clearAuthError());
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const sessionUser = await dispatch(loginThunk(values)).unwrap();
      const fallbackTarget = getDashboardPathForRole(sessionUser.role);
      const redirectTarget = resolveSafeRedirectTarget(
        searchParams.get("redirect"),
        fallbackTarget,
      );

      router.replace(redirectTarget);
      router.refresh();
    } catch {
      // The slice already exposes the backend error to the UI.
    }
  }

  return {
    errorMessage,
    handleSubmit,
    isSubmitting,
    updateField,
    values,
  };
}
