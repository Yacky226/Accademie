import type {
  SessionSnapshot,
  SessionUser,
  UserRole,
} from "@/entities/user/model/user-session.types";

export type RegisterRole = Exclude<UserRole, "admin">;

export interface LoginCredentials {
  email: string;
  password: string;
  rememberSession: boolean;
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
  role: RegisterRole;
  acceptTerms: boolean;
}

export type LoginFormValues = LoginCredentials;

export type RegisterFormValues = RegisterPayload;

export interface ForgotPasswordValues {
  email: string;
}

export interface ResetPasswordValues {
  password: string;
  rememberSession: boolean;
  token: string;
}

export interface VerifyEmailValues {
  email: string;
  token: string;
}

export interface AuthActionFeedback {
  message: string;
  previewToken?: string | null;
  previewUrl?: string | null;
}

export interface AuthState extends SessionSnapshot {
  actionPreviewToken: string | null;
  actionPreviewUrl: string | null;
  errorMessage: string | null;
  isInitialized: boolean;
  pendingAction:
    | "forgotPassword"
    | "login"
    | "logout"
    | "logoutAll"
    | "profile"
    | "register"
    | "requestEmailVerification"
    | "resetPassword"
    | "verifyEmail"
    | null;
  statusMessage: string | null;
}

export interface AuthRequestContext {
  email?: string;
  fallbackRole?: UserRole;
  fullName?: string;
}

export interface AuthenticatedSession {
  accessToken: string;
  user: SessionUser;
}

export interface RequestPasswordResetPayload {
  email: string;
}

export interface ResetPasswordPayload {
  password: string;
  rememberSession: boolean;
  token: string;
}

export interface RequestEmailVerificationPayload {
  email: string;
}

export interface VerifyEmailPayload {
  token: string;
}
