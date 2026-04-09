import { requestApiJson } from "@/core/api/api-http-client";
import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type {
  AdminAnnouncementRecord,
  AdminAnalyticsActivityRecord,
  AdminAnalyticsOverviewRecord,
  AdminAuditLogRecord,
  AdminHealthRecord,
  AdminOverviewRecord,
  AdminSettingRecord,
  AdminWorkspaceCourseRecord,
  AdminWorkspacePaymentRecord,
  AdminWorkspaceSupportTicketRecord,
  AdminWorkspaceUserRecord,
} from "./admin-space.types";

type BackendRole = string | { name?: string };

type BackendUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roles?: BackendRole[];
  lastLoginAt?: string;
  createdAt?: string;
  onboardingCompletedAt?: string;
};

type BackendCourse = {
  id: string;
  title: string;
  slug: string;
  price: string;
  currency: string;
  level: string;
  status: string;
  isPublished: boolean;
  durationInHours?: number;
  creator: {
    firstName: string;
    lastName: string;
  };
  modules?: unknown[];
  enrollmentsCount: number;
  createdAt?: string;
};

type BackendPayment = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  isSubscription: boolean;
  subscriptionPlanCode?: string;
  description?: string;
  paidAt?: string;
  createdAt?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    title: string;
  };
  provider?: string;
};

type BackendSupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  description: string;
  resolution?: string;
  createdAt?: string;
  updatedAt?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

type BackendAuditLog = {
  id: string;
  action: string;
  resource: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

type BackendSetting = {
  id: string;
  key: string;
  value: string;
  description?: string;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type BackendAnnouncement = {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
};

function readNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function mapUser(user: BackendUser): AdminWorkspaceUserRecord {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    status: user.status,
    roles: (user.roles ?? [])
      .map((role) => (typeof role === "string" ? role : role.name ?? ""))
      .filter(Boolean),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt ?? null,
    onboardingCompletedAt: user.onboardingCompletedAt ?? null,
  };
}

function mapCourse(course: BackendCourse): AdminWorkspaceCourseRecord {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    creatorName: `${course.creator.firstName} ${course.creator.lastName}`.trim(),
    level: course.level,
    status: course.status,
    isPublished: course.isPublished,
    enrollmentsCount: course.enrollmentsCount,
    modulesCount: Array.isArray(course.modules) ? course.modules.length : 0,
    durationInHours: course.durationInHours ?? null,
    price: readNumber(course.price),
    currency: course.currency,
    createdAt: course.createdAt ?? null,
  };
}

function mapPayment(payment: BackendPayment): AdminWorkspacePaymentRecord {
  return {
    id: payment.id,
    reference: payment.reference,
    amount: readNumber(payment.amount),
    currency: payment.currency,
    status: payment.status,
    isSubscription: payment.isSubscription,
    subscriptionPlanCode: payment.subscriptionPlanCode ?? null,
    description: payment.description ?? null,
    paidAt: payment.paidAt ?? null,
    createdAt: payment.createdAt ?? null,
    provider: payment.provider ?? null,
    userName: payment.user
      ? `${payment.user.firstName} ${payment.user.lastName}`.trim()
      : null,
    userEmail: payment.user?.email ?? null,
    courseTitle: payment.course?.title ?? null,
  };
}

function mapSupportTicket(ticket: BackendSupportTicket): AdminWorkspaceSupportTicketRecord {
  return {
    id: ticket.id,
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    description: ticket.description,
    resolution: ticket.resolution ?? null,
    createdAt: ticket.createdAt ?? null,
    updatedAt: ticket.updatedAt ?? null,
    userName: `${ticket.user.firstName} ${ticket.user.lastName}`.trim(),
    userEmail: ticket.user.email,
  };
}

function mapAuditLog(log: BackendAuditLog): AdminAuditLogRecord {
  return {
    id: log.id,
    action: log.action,
    resource: log.resource,
    userId: log.userId ?? null,
    ipAddress: log.ipAddress ?? null,
    userAgent: log.userAgent ?? null,
    createdAt: log.createdAt ?? null,
    metadata: log.metadata ?? null,
  };
}

function mapSetting(setting: BackendSetting): AdminSettingRecord {
  return {
    id: setting.id,
    key: setting.key,
    value: setting.value,
    description: setting.description ?? null,
    isPublic: setting.isPublic,
    createdAt: setting.createdAt ?? null,
    updatedAt: setting.updatedAt ?? null,
  };
}

function mapAnnouncement(announcement: BackendAnnouncement): AdminAnnouncementRecord {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    isPublished: announcement.isPublished,
    publishedAt: announcement.publishedAt ?? null,
    createdAt: announcement.createdAt ?? null,
    updatedAt: announcement.updatedAt ?? null,
    createdByName: announcement.createdBy
      ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`.trim()
      : null,
  };
}

export function fetchAdminOverview() {
  return requestAuthenticatedApiJson<AdminOverviewRecord>(
    "/api/admin/overview",
    { method: "GET" },
    "Impossible de charger la vue admin.",
  );
}

export function fetchAdminUsers() {
  return requestAuthenticatedApiJson<BackendUser[]>(
    "/api/users",
    { method: "GET" },
    "Impossible de charger les utilisateurs.",
  ).then((response) => response.map(mapUser));
}

export function createAdminUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleNames: string[];
  status?: string;
}) {
  return requestAuthenticatedApiJson<BackendUser>(
    "/api/users",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Impossible de creer cet utilisateur.",
  ).then(mapUser);
}

export function deleteAdminUser(userId: string) {
  return requestAuthenticatedApiJson<null>(
    `/api/users/${userId}`,
    {
      method: "DELETE",
    },
    "Impossible de supprimer cet utilisateur.",
  );
}

export function updateAdminUserStatus(userId: string, status: string) {
  return requestAuthenticatedApiJson<BackendUser>(
    `/api/admin/users/${userId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    "Impossible de mettre a jour le statut utilisateur.",
  ).then(mapUser);
}

export function updateAdminUserRoles(userId: string, roleNames: string[]) {
  return requestAuthenticatedApiJson<BackendUser>(
    `/api/admin/users/${userId}/roles`,
    {
      method: "PATCH",
      body: JSON.stringify({ roleNames }),
    },
    "Impossible de mettre a jour les roles utilisateur.",
  ).then(mapUser);
}

export function fetchAdminCourses() {
  return requestAuthenticatedApiJson<BackendCourse[]>(
    "/api/courses",
    { method: "GET" },
    "Impossible de charger le catalogue admin.",
  ).then((response) => response.map(mapCourse));
}

export function createAdminCourse(input: {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  currency: string;
  level: string;
  status: string;
  isPublished: boolean;
  durationInHours?: number;
  certificateEnabled?: boolean;
}) {
  return requestAuthenticatedApiJson<BackendCourse>(
    "/api/courses",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Impossible de creer ce cours.",
  ).then(mapCourse);
}

export function updateAdminCourse(
  courseId: string,
  input: Partial<{
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    thumbnailUrl: string;
    price: number;
    currency: string;
    level: string;
    status: string;
    isPublished: boolean;
    durationInHours: number;
    certificateEnabled: boolean;
  }>,
) {
  return requestAuthenticatedApiJson<BackendCourse>(
    `/api/courses/${courseId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    "Impossible de mettre a jour ce cours.",
  ).then(mapCourse);
}

export function deleteAdminCourse(courseId: string) {
  return requestAuthenticatedApiJson<null>(
    `/api/courses/${courseId}`,
    {
      method: "DELETE",
    },
    "Impossible de supprimer ce cours.",
  );
}

export function fetchAdminPayments() {
  return requestAuthenticatedApiJson<BackendPayment[]>(
    "/api/payments",
    { method: "GET" },
    "Impossible de charger les paiements.",
  ).then((response) => response.map(mapPayment));
}

export function confirmAdminPayment(paymentId: string) {
  return requestAuthenticatedApiJson<BackendPayment>(
    `/api/payments/${paymentId}/confirm`,
    {
      method: "PATCH",
      body: JSON.stringify({ provider: "ADMIN_MANUAL_REVIEW" }),
    },
    "Impossible de confirmer ce paiement.",
  ).then(mapPayment);
}

export function refundAdminPayment(
  paymentId: string,
  input: {
    amount?: number;
    reason?: string;
  } = {},
) {
  return requestAuthenticatedApiJson<BackendPayment>(
    `/api/payments/${paymentId}/refund`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    "Impossible de rembourser ce paiement.",
  ).then(mapPayment);
}

export function fetchAdminAnalyticsOverview() {
  return requestAuthenticatedApiJson<AdminAnalyticsOverviewRecord>(
    "/api/analytics/overview",
    { method: "GET" },
    "Impossible de charger les analytics.",
  );
}

export function fetchAdminAnalyticsActivity(days = 30) {
  return requestAuthenticatedApiJson<AdminAnalyticsActivityRecord>(
    `/api/analytics/activity?days=${days}`,
    { method: "GET" },
    "Impossible de charger l activite analytique.",
  );
}

export function fetchAdminSupportTickets() {
  return requestAuthenticatedApiJson<BackendSupportTicket[]>(
    "/api/support/tickets",
    { method: "GET" },
    "Impossible de charger les tickets support.",
  ).then((response) => response.map(mapSupportTicket));
}

export function updateAdminSupportTicketStatus(
  ticketId: string,
  status: string,
  resolution?: string,
) {
  return requestAuthenticatedApiJson<BackendSupportTicket>(
    `/api/support/tickets/${ticketId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
        resolution: resolution?.trim() || undefined,
      }),
    },
    "Impossible de mettre a jour le ticket.",
  ).then(mapSupportTicket);
}

export function fetchAdminAuditLogs(limit = 50) {
  return requestAuthenticatedApiJson<BackendAuditLog[]>(
    `/api/admin/audit-logs?limit=${limit}`,
    { method: "GET" },
    "Impossible de charger les journaux d audit.",
  ).then((response) => response.map(mapAuditLog));
}

export function fetchAdminSettings() {
  return requestAuthenticatedApiJson<BackendSetting[]>(
    "/api/academy/settings",
    { method: "GET" },
    "Impossible de charger les parametres plateforme.",
  ).then((response) => response.map(mapSetting));
}

export function fetchAdminAnnouncements() {
  return requestAuthenticatedApiJson<BackendAnnouncement[]>(
    "/api/academy/announcements/all",
    { method: "GET" },
    "Impossible de charger les annonces.",
  ).then((response) => response.map(mapAnnouncement));
}

export function createAdminAnnouncement(input: {
  title: string;
  content: string;
  isPublished?: boolean;
}) {
  return requestAuthenticatedApiJson<BackendAnnouncement>(
    "/api/academy/announcements",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Impossible de creer cette annonce.",
  ).then(mapAnnouncement);
}

export function updateAdminAnnouncement(
  announcementId: string,
  input: {
    title?: string;
    content?: string;
    isPublished?: boolean;
  },
) {
  return requestAuthenticatedApiJson<BackendAnnouncement>(
    `/api/academy/announcements/${announcementId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    "Impossible de mettre a jour cette annonce.",
  ).then(mapAnnouncement);
}

export function deleteAdminAnnouncement(announcementId: string) {
  return requestAuthenticatedApiJson<null>(
    `/api/academy/announcements/${announcementId}`,
    {
      method: "DELETE",
    },
    "Impossible de supprimer cette annonce.",
  );
}

export function createAdminSetting(input: {
  key: string;
  value: string;
  description?: string;
  isPublic?: boolean;
}) {
  return requestAuthenticatedApiJson<BackendSetting>(
    "/api/academy/settings",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Impossible de creer ce parametre.",
  ).then(mapSetting);
}

export function updateAdminSetting(
  key: string,
  input: {
    value: string;
    description?: string;
    isPublic?: boolean;
  },
) {
  return requestAuthenticatedApiJson<BackendSetting>(
    `/api/academy/settings/${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    "Impossible de mettre a jour ce parametre.",
  ).then(mapSetting);
}

export async function fetchAdminHealth(): Promise<AdminHealthRecord> {
  const [frontendResponse, backendResponse] = await Promise.all([
    fetch("/api/health", {
      cache: "no-store",
      credentials: "include",
    }).then((response) => response.json() as Promise<{ status?: string }>),
    requestApiJson<{ status?: string; database?: string; timestamp?: string }>(
      "/health",
      { method: "GET" },
      "Impossible de verifier la sante du backend.",
    ),
  ]);

  return {
    frontendStatus: frontendResponse.status ?? "unknown",
    backendStatus: backendResponse.status ?? "unknown",
    databaseStatus: backendResponse.database ?? "unknown",
    checkedAt: backendResponse.timestamp ?? null,
  };
}
