export const USER_ROLES = ["student", "teacher", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface SessionUser {
  id: string | null;
  email: string | null;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface SessionSnapshot {
  isAuthenticated: boolean;
  user: SessionUser | null;
}

export function isUserRole(value: string | null | undefined): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function formatUserRoleLabel(role: UserRole) {
  if (role === "admin") {
    return "Platform admin";
  }

  if (role === "teacher") {
    return "Lead mentor";
  }

  return "Student";
}
