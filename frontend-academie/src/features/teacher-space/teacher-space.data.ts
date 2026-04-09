import type { TeacherNavItem } from "./teacher-space.types";

export const teacherNavItems: TeacherNavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: "dashboard" },
  { label: "Calendar", href: "/teacher/calendar", icon: "calendar" },
  { label: "Evaluations", href: "/teacher/evaluations", icon: "evaluations" },
  { label: "My Courses", href: "/teacher/programs", icon: "courses" },
  { label: "Students", href: "/teacher/students", icon: "users" },
  { label: "Settings", href: "/teacher/settings", icon: "settings" },
];
