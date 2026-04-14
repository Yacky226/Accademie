import type { ReactNode } from "react";
import type { WorkspaceNavIconName } from "@/features/workspace-shell/model/workspace-nav.types";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: WorkspaceNavIconName;
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

export interface AdminOverviewRecord {
  usersPendingApproval: number;
  usersSuspended: number;
  usersInactive: number;
  coursesDraft: number;
  evaluationsDraft: number;
  announcementsDraft: number;
}

export interface AdminAnalyticsOverviewRecord {
  usersTotal: number;
  usersActive: number;
  coursesTotal: number;
  coursesPublished: number;
  enrollmentsTotal: number;
  programsTotal: number;
  problemsTotal: number;
  evaluationsTotal: number;
  submissionsTotal: number;
  gradesTotal: number;
  calendarEventsTotal: number;
  notificationsTotal: number;
}

export interface AdminAnalyticsActivityRecord {
  periodDays: number;
  newUsers: number;
  newEnrollments: number;
  submissionsCreated: number;
  evaluationAttemptsStarted: number;
  notificationsSent: number;
}

export interface AdminWorkspaceUserRecord {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string | null;
  onboardingCompletedAt: string | null;
}

export interface AdminWorkspaceCourseRecord {
  id: string;
  title: string;
  slug: string;
  creatorName: string;
  level: string;
  status: string;
  isPublished: boolean;
  enrollmentsCount: number;
  modulesCount: number;
  durationInHours: number | null;
  price: number;
  currency: string;
  createdAt: string | null;
}

export interface AdminWorkspacePaymentRecord {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  isSubscription: boolean;
  subscriptionPlanCode: string | null;
  description: string | null;
  paidAt: string | null;
  createdAt: string | null;
  provider: string | null;
  userName: string | null;
  userEmail: string | null;
  courseTitle: string | null;
}

export interface AdminWorkspaceSupportTicketRecord {
  id: string;
  subject: string;
  category: string;
  status: string;
  description: string;
  resolution: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  userName: string;
  userEmail: string;
}

export interface AdminAuditLogRecord {
  id: string;
  action: string;
  resource: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AdminSettingRecord {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminHealthRecord {
  frontendStatus: string;
  backendStatus: string;
  databaseStatus: string;
  checkedAt: string | null;
}

export interface AdminAnnouncementRecord {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdByName: string | null;
}

export interface AdminEvaluationQuestionRecord {
  id: string;
  statement: string;
  questionType: string;
  options: string[];
  correctAnswer: string | null;
  points: number;
  position: number;
}

export interface AdminEvaluationRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  instructions: string;
  durationInMinutes: number | null;
  maxAttempts: number;
  passScore: number;
  startsAt: string | null;
  endsAt: string | null;
  isPublished: boolean;
  creatorId: string;
  creatorName: string;
  course:
    | {
        id: string;
        title: string;
        slug: string;
      }
    | null;
  questions: AdminEvaluationQuestionRecord[];
  attemptsCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminEvaluationAttemptRecord {
  id: string;
  status: string;
  answers: Record<string, unknown> | null;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  grader: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  evaluation: {
    id: string;
    title: string;
    slug: string;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminNotificationRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  recipient: {
    id: string;
    fullName: string;
    email: string;
  };
  sender: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
}
