import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  SessionSnapshot,
  SessionUser,
} from "@/entities/user/model/user-session.types";
import {
  requestEmailVerificationConfirmation,
  requestEmailVerificationLink,
  requestCurrentSession,
  requestLoginSession,
  requestLogoutAllSessions,
  requestPasswordResetCompletion,
  requestPasswordResetLink,
  requestRegistrationSession,
  requestSessionLogout,
} from "../api/auth-api.client";
import {
  clearPersistedAuthenticatedSession,
  persistAuthenticatedSession,
} from "./auth-session-persistence";
import type {
  AuthActionFeedback,
  AuthState,
  LoginCredentials,
  RegisterPayload,
  RequestEmailVerificationPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "./auth.types";

const initialState: AuthState = {
  actionPreviewToken: null,
  actionPreviewUrl: null,
  errorMessage: null,
  isAuthenticated: false,
  isInitialized: false,
  pendingAction: null,
  statusMessage: null,
  user: null,
};

export function createAuthPreloadedState(snapshot: SessionSnapshot): AuthState {
  return {
    ...initialState,
    isAuthenticated: snapshot.isAuthenticated,
    isInitialized: true,
    user: snapshot.user,
  };
}

export const loginThunk = createAsyncThunk<SessionUser, LoginCredentials, { rejectValue: string }>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      return persistAuthenticatedSession(await requestLoginSession(credentials));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unable to sign in.");
    }
  },
);

export const registerThunk = createAsyncThunk<SessionUser, RegisterPayload, { rejectValue: string }>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      return persistAuthenticatedSession(await requestRegistrationSession(payload));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unable to register.");
    }
  },
);

export const fetchCurrentSessionThunk = createAsyncThunk<
  SessionUser,
  void,
  { rejectValue: string }
>("auth/fetchCurrentSession", async (_, { rejectWithValue }) => {
  try {
    return persistAuthenticatedSession(await requestCurrentSession());
  } catch (error) {
    clearPersistedAuthenticatedSession();
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to verify the session.",
    );
  }
});

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await requestSessionLogout();
      clearPersistedAuthenticatedSession();
    } catch (error) {
      clearPersistedAuthenticatedSession();
      return rejectWithValue(error instanceof Error ? error.message : "Unable to log out.");
    }
  },
);

export const logoutAllSessionsThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logoutAll",
  async (_, { rejectWithValue }) => {
    try {
      await requestLogoutAllSessions();
      clearPersistedAuthenticatedSession();
    } catch (error) {
      clearPersistedAuthenticatedSession();
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to close all sessions.",
      );
    }
  },
);

export const requestPasswordResetThunk = createAsyncThunk<
  AuthActionFeedback,
  RequestPasswordResetPayload,
  { rejectValue: string }
>("auth/requestPasswordReset", async (payload, { rejectWithValue }) => {
  try {
    return await requestPasswordResetLink(payload);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Unable to start the password reset flow.",
    );
  }
});

export const resetPasswordThunk = createAsyncThunk<
  SessionUser,
  ResetPasswordPayload,
  { rejectValue: string }
>("auth/resetPassword", async (payload, { rejectWithValue }) => {
  try {
    return persistAuthenticatedSession(await requestPasswordResetCompletion(payload));
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to reset the password.",
    );
  }
});

export const requestEmailVerificationThunk = createAsyncThunk<
  AuthActionFeedback,
  RequestEmailVerificationPayload,
  { rejectValue: string }
>("auth/requestEmailVerification", async (payload, { rejectWithValue }) => {
  try {
    return await requestEmailVerificationLink(payload);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Unable to prepare a verification link.",
    );
  }
});

export const verifyEmailThunk = createAsyncThunk<
  AuthActionFeedback,
  VerifyEmailPayload,
  { rejectValue: string }
>("auth/verifyEmail", async (payload, { rejectWithValue }) => {
  try {
    return await requestEmailVerificationConfirmation(payload);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to verify this email address.",
    );
  }
});

function resetAuthFeedback(state: AuthState) {
  state.actionPreviewToken = null;
  state.actionPreviewUrl = null;
  state.errorMessage = null;
  state.statusMessage = null;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.errorMessage = null;
    },
    clearAuthFeedback(state) {
      resetAuthFeedback(state);
    },
    hydrateAuthState(state, action: { payload: SessionSnapshot }) {
      state.actionPreviewToken = null;
      state.actionPreviewUrl = null;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.isInitialized = true;
      state.user = action.payload.user;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginThunk.pending, (state) => {
        resetAuthFeedback(state);
        state.pendingAction = "login";
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.pendingAction = null;
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? "Unable to sign in.";
        state.pendingAction = null;
      })
      .addCase(registerThunk.pending, (state) => {
        resetAuthFeedback(state);
        state.pendingAction = "register";
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.pendingAction = null;
        state.user = action.payload;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? "Unable to register.";
        state.pendingAction = null;
      })
      .addCase(fetchCurrentSessionThunk.pending, (state) => {
        state.errorMessage = null;
        state.pendingAction = "profile";
      })
      .addCase(fetchCurrentSessionThunk.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.pendingAction = null;
        state.user = action.payload;
      })
      .addCase(fetchCurrentSessionThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.pendingAction = null;
        state.user = null;
      })
      .addCase(logoutThunk.pending, (state) => {
        state.pendingAction = "logout";
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        resetAuthFeedback(state);
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.pendingAction = null;
        state.user = null;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.pendingAction = null;
        state.user = null;
      })
      .addCase(logoutAllSessionsThunk.pending, (state) => {
        state.pendingAction = "logoutAll";
      })
      .addCase(logoutAllSessionsThunk.fulfilled, (state) => {
        resetAuthFeedback(state);
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.pendingAction = null;
        state.user = null;
      })
      .addCase(logoutAllSessionsThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.pendingAction = null;
        state.user = null;
      })
      .addCase(requestPasswordResetThunk.pending, (state) => {
        resetAuthFeedback(state);
        state.pendingAction = "forgotPassword";
      })
      .addCase(requestPasswordResetThunk.fulfilled, (state, action) => {
        state.actionPreviewToken = action.payload.previewToken ?? null;
        state.actionPreviewUrl = action.payload.previewUrl ?? null;
        state.pendingAction = null;
        state.statusMessage = action.payload.message;
      })
      .addCase(requestPasswordResetThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to start the password reset flow.";
        state.pendingAction = null;
      })
      .addCase(resetPasswordThunk.pending, (state) => {
        resetAuthFeedback(state);
        state.pendingAction = "resetPassword";
      })
      .addCase(resetPasswordThunk.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.pendingAction = null;
        state.statusMessage = "Your password has been reset successfully.";
        state.user = action.payload;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? "Unable to reset the password.";
        state.pendingAction = null;
      })
      .addCase(requestEmailVerificationThunk.pending, (state) => {
        resetAuthFeedback(state);
        state.pendingAction = "requestEmailVerification";
      })
      .addCase(requestEmailVerificationThunk.fulfilled, (state, action) => {
        state.actionPreviewToken = action.payload.previewToken ?? null;
        state.actionPreviewUrl = action.payload.previewUrl ?? null;
        state.pendingAction = null;
        state.statusMessage = action.payload.message;
      })
      .addCase(requestEmailVerificationThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to prepare a verification link.";
        state.pendingAction = null;
      })
      .addCase(verifyEmailThunk.pending, (state) => {
        state.errorMessage = null;
        state.pendingAction = "verifyEmail";
      })
      .addCase(verifyEmailThunk.fulfilled, (state, action) => {
        state.pendingAction = null;
        state.statusMessage = action.payload.message;
        state.actionPreviewToken = null;
        state.actionPreviewUrl = null;
        if (state.user) {
          state.user.emailVerified = true;
        }
      })
      .addCase(verifyEmailThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to verify this email address.";
        state.pendingAction = null;
      });
  },
});

export const { clearAuthError, clearAuthFeedback, hydrateAuthState } = authSlice.actions;
export const authReducer = authSlice.reducer;
