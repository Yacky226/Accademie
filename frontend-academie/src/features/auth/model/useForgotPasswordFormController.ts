"use client";

import { useState } from "react";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import {
  clearAuthFeedback,
  requestPasswordResetThunk,
} from "./auth.slice";
import { useCurrentAuthSession } from "./useCurrentAuthSession";

export function useForgotPasswordFormController() {
  const dispatch = useAuthStoreDispatch();
  const {
    actionPreviewUrl,
    errorMessage,
    pendingAction,
    statusMessage,
  } = useCurrentAuthSession();
  const [email, setEmail] = useState("");

  const isSubmitting = pendingAction === "forgotPassword";

  function updateEmail(nextEmail: string) {
    setEmail(nextEmail);
    if (errorMessage || statusMessage || actionPreviewUrl) {
      dispatch(clearAuthFeedback());
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await dispatch(requestPasswordResetThunk({ email }));
  }

  return {
    email,
    errorMessage,
    handleSubmit,
    isSubmitting,
    previewUrl: actionPreviewUrl,
    statusMessage,
    updateEmail,
  };
}
