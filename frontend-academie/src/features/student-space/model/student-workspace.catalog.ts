import type { StudentNavItem } from "./student-workspace.types";

export const studentNavItems: StudentNavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
  { label: "Notifications", href: "/student/notifications", icon: "notifications" },
  { label: "My Courses", href: "/student/courses", icon: "courses" },
  { label: "Evaluations", href: "/student/evaluations", icon: "evaluations" },
  { label: "Payments", href: "/student/payments", icon: "payments" },
  { label: "Leaderboard", href: "/student/leaderboard", icon: "leaderboard" },
  { label: "Code Editor", href: "/student/problems", icon: "code" },
  { label: "Calendar", href: "/student/calendar", icon: "calendar" },
  { label: "Settings", href: "/student/settings", icon: "settings" },
  { label: "Support", href: "/student/support", icon: "support" },
];
