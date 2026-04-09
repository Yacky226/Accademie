import type { AdminNavItem } from "./admin-space.types";

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { label: "Users", href: "/admin/users", icon: "users" },
  { label: "Course Catalog", href: "/admin/formations", icon: "courses" },
  { label: "Announcements", href: "/admin/announcements", icon: "announcements" },
  { label: "Payments", href: "/admin/payments", icon: "payments" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Support", href: "/admin/support", icon: "support" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: "audit" },
  { label: "System Health", href: "/admin/system-health", icon: "systemHealth" },
];
