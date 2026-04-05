"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import type { SessionSnapshot } from "@/entities/user/model/user-session.types";
import { createAuthPreloadedState, fetchCurrentSessionThunk } from "@/features/auth/model/auth.slice";
import { useAppDispatch } from "@/core/store/app-store-hooks";
import { createAppStore, type AppStore } from "@/core/store/app-store";

interface ApplicationProvidersProps {
  children: React.ReactNode;
  initialSession: SessionSnapshot;
}

function SessionBootstrap({ shouldRefresh }: { shouldRefresh: boolean }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!shouldRefresh) {
      return;
    }

    void dispatch(fetchCurrentSessionThunk());
  }, [dispatch, shouldRefresh]);

  return null;
}

export function ApplicationProviders({
  children,
  initialSession,
}: ApplicationProvidersProps) {
  const [store] = useState<AppStore>(() =>
    createAppStore({
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
