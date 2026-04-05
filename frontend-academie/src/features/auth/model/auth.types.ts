import type {
  SessionSnapshot,
  SessionUser,
  UserRole,
} from "@/entities/user/model/user-session.types";

export interface LoginCredentials {
  email: string;
  password: string;
  rememberSession: boolean;
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  acceptTerms: boolean;
}

export type LoginFormValues = LoginCredentials;

export type RegisterFormValues = RegisterPayload;

export interface AuthState extends SessionSnapshot {
  errorMessage: string | null;
  isInitialized: boolean;
  pendingAction: "login" | "logout" | "profile" | "register" | null;
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
