"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import type { SessionSnapshot } from "@/entities/user/model/user-session.types";
import { createAuthPreloadedState, fetchCurrentSessionThunk } from "@/features/auth/model/auth.slice";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import { createAuthStore, type AuthStore } from "@/core/store/auth-store";

interface AuthProvidersProps {
  children: React.ReactNode;
  initialSession: SessionSnapshot;
}

function SessionBootstrap({ shouldRefresh }: { shouldRefresh: boolean }) {
  const dispatch = useAuthStoreDispatch();

  useEffect(() => {
    if (!shouldRefresh) {
      return;
    }

    void dispatch(fetchCurrentSessionThunk());
  }, [dispatch, shouldRefresh]);

  return null;
}

export function AuthProviders({ children, initialSession }: AuthProvidersProps) {
  const [store] = useState<AuthStore>(() =>
    createAuthStore({
      auth: createAuthPreloadedState(initialSession),
    }),
  );

  return (
    <Provider store={store}>
      <SessionBootstrap shouldRefresh={initialSession.isAuthenticated} />
      {children}
    </Provider>
  );
}
