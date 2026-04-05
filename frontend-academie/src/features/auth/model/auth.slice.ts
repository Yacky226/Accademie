import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  SessionSnapshot,
  SessionUser,
} from "@/entities/user/model/user-session.types";
import {
  requestCurrentSession,
  requestLoginSession,
  requestRegistrationSession,
  requestSessionLogout,
} from "../api/auth-api.client";
import {
  clearPersistedAuthenticatedSession,
  persistAuthenticatedSession,
} from "./auth-session-persistence";
import type { AuthState, LoginCredentials, RegisterPayload } from "./auth.types";

const initialState: AuthState = {
  errorMessage: null,
  isAuthenticated: false,
  isInitialized: false,
  pendingAction: null,
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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.errorMessage = null;
    },
    hydrateAuthState(state, action: { payload: SessionSnapshot }) {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.isInitialized = true;
      state.user = action.payload.user;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.errorMessage = null;
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
        state.errorMessage = null;
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
        state.errorMessage = null;
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
      });
  },
});

export const { clearAuthError, hydrateAuthState } = authSlice.actions;
export const authReducer = authSlice.reducer;
