import type { ReactNode } from "react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
}

export interface AdminUserRow {
  initials: string;
  name: string;
  email: string;
  role: "Student" | "Teacher" | "Admin";
  lastLogin: string;
  status: "Active" | "Pending" | "Suspended";
}

export interface AdminCourseRow {
  title: string;
  instructor: string;
  category: string;
  status: "Published" | "Scheduled" | "Draft";
  enrollments: string;
  rating: string;
  trend: string;
}

export interface AdminTransactionRow {
  id: string;
  client: string;
  date: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed" | "Refunded";
}

export interface AdminKpi {
  label: string;
  value: string;
  detail: string;
  tone?: "primary" | "success" | "warning" | "error";
}

export interface AdminLayoutProps {
  activePath: string;
  title: string;
  children: ReactNode;
}
