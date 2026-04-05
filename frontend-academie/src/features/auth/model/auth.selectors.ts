import type { RootState } from "@/core/store/app-store";

export const selectAuthState = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthError = (state: RootState) => state.auth.errorMessage;
export const selectPendingAuthAction = (state: RootState) => state.auth.pendingAction;
