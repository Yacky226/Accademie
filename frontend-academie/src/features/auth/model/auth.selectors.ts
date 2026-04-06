import type { AuthStoreState } from "@/core/store/auth-store";

export const selectAuthState = (state: AuthStoreState) => state.auth;
export const selectIsAuthenticated = (state: AuthStoreState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: AuthStoreState) => state.auth.user;
export const selectAuthError = (state: AuthStoreState) => state.auth.errorMessage;
export const selectPendingAuthAction = (state: AuthStoreState) => state.auth.pendingAction;
export const selectAuthStatusMessage = (state: AuthStoreState) => state.auth.statusMessage;
export const selectAuthActionPreviewUrl = (state: AuthStoreState) => state.auth.actionPreviewUrl;
export const selectAuthActionPreviewToken = (state: AuthStoreState) => state.auth.actionPreviewToken;
