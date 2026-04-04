import type {
  AdminCourseRow,
  AdminKpi,
  AdminNavItem,
  AdminTransactionRow,
  AdminUserRow,
} from "./admin-space.types";

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "DB" },
  { label: "Users", href: "/admin/users", icon: "US" },
  { label: "Course Catalog", href: "/admin/formations", icon: "CC" },
  { label: "Payments", href: "/admin/payments", icon: "PM" },
  { label: "Settings", href: "/admin/settings", icon: "ST" },
  { label: "Analytics", href: "/admin/analytics", icon: "AN" },
  { label: "Support", href: "/admin/support", icon: "SP" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: "AL" },
  { label: "System Health", href: "/admin/system-health", icon: "SH" },
];

export const adminDashboardKpis: AdminKpi[] = [
  {
    label: "Revenu Total",
    value: "1.284.500 EUR",
    detail: "+12.4% vs mois dernier",
    tone: "success",
  },
  {
    label: "Etudiants Actifs",
    value: "42.890",
    detail: "+5.2% cette semaine",
    tone: "success",
  },
  {
    label: "Uptime Systeme",
    value: "99.98%",
    detail: "Stable sur 24h",
    tone: "primary",
  },
  { label: "Cours a Risque", value: "14", detail: "8 urgents", tone: "error" },
];

export const adminUsers: AdminUserRow[] = [
  {
    initials: "ES",
    name: "Elena Sorova",
    email: "elena.s@academy.edu",
    role: "Student",
    lastLogin: "2023-11-24 14:32",
    status: "Active",
  },
  {
    initials: "MT",
    name: "Marcus Thorne",
    email: "m.thorne@academy.edu",
    role: "Teacher",
    lastLogin: "2023-11-23 09:15",
    status: "Active",
  },
  {
    initials: "JW",
    name: "Julian White",
    email: "j.white@extern.com",
    role: "Student",
    lastLogin: "Never",
    status: "Pending",
  },
  {
    initials: "SC",
    name: "Sarah Chen",
    email: "s.chen@academy.edu",
    role: "Admin",
    lastLogin: "2023-10-12 11:00",
    status: "Suspended",
  },
];

export const adminCourses: AdminCourseRow[] = [
  {
    title: "Advanced React Architectures",
    instructor: "Sarah Jenkins",
    category: "Frontend",
    status: "Published",
    enrollments: "4,502",
    rating: "4.9",
    trend: "+14.2%",
  },
  {
    title: "AWS Cloud Practitioner Masterclass",
    instructor: "Michael Chen",
    category: "Cloud",
    status: "Scheduled",
    enrollments: "1,208",
    rating: "4.7",
    trend: "Stable",
  },
  {
    title: "Backend Engineering with Go",
    instructor: "Elena Rodriguez",
    category: "Backend",
    status: "Draft",
    enrollments: "0",
    rating: "-",
    trend: "-",
  },
  {
    title: "Deep Learning Foundations",
    instructor: "Dr. Aris Varma",
    category: "AI/ML",
    status: "Published",
    enrollments: "8,920",
    rating: "4.6",
    trend: "-2.1%",
  },
];

export const adminTransactions: AdminTransactionRow[] = [
  {
    id: "#TX-88210",
    client: "Jean Dupont",
    date: "Aujourd'hui, 14:22",
    amount: "149.00 EUR",
    status: "Paid",
  },
  {
    id: "#TX-88209",
    client: "Marie Lefebvre",
    date: "Hier, 10:15",
    amount: "89.00 EUR",
    status: "Pending",
  },
  {
    id: "#TX-88208",
    client: "Antoine Bernard",
    date: "12 Oct, 18:45",
    amount: "299.00 EUR",
    status: "Failed",
  },
  {
    id: "#TX-88207",
    client: "Sophie Robert",
    date: "11 Oct, 09:30",
    amount: "149.00 EUR",
    status: "Refunded",
  },
];
