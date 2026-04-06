import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type {
  NotificationIconName,
  NotificationItem,
  NotificationTone,
} from "../model/notification-center.catalog";
import type { BackendNotificationResponse } from "../model/notification-center.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function toRelativeTimeLabel(dateValue: string) {
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) {
    return "now";
  }

  const diffInMinutes = Math.round((timestamp - Date.now()) / (60 * 1000));
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffInMinutes) < 60) {
    return formatter.format(diffInMinutes, "minute");
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return formatter.format(diffInHours, "hour");
  }

  const diffInDays = Math.round(diffInHours / 24);
  return formatter.format(diffInDays, "day");
}

function inferNotificationKind(
  notification: BackendNotificationResponse,
): NotificationItem["kind"] {
  const typeValue = notification.type.trim().toLowerCase();
  const metadataCategory = readMetadataString(notification.metadata, "kind")?.toLowerCase();

  if (metadataCategory === "course" || typeValue.includes("course") || typeValue.includes("module")) {
    return "course";
  }

  if (
    metadataCategory === "mentor" ||
    typeValue.includes("mentor") ||
    typeValue.includes("feedback") ||
    typeValue.includes("comment") ||
    Boolean(notification.sender)
  ) {
    return "mentor";
  }

  return "system";
}

function inferNotificationTone(
  notification: BackendNotificationResponse,
  kind: NotificationItem["kind"],
): NotificationTone {
  const typeValue = notification.type.trim().toLowerCase();

  if (typeValue.includes("error") || typeValue.includes("urgent") || typeValue.includes("warning")) {
    return "error";
  }

  if (typeValue.includes("success") || typeValue.includes("complete")) {
    return "success";
  }

  if (kind === "mentor") {
    return "primary";
  }

  if (kind === "course") {
    return "tertiary";
  }

  return "info";
}

function inferNotificationIcon(
  notification: BackendNotificationResponse,
  kind: NotificationItem["kind"],
): NotificationIconName {
  const typeValue = notification.type.trim().toLowerCase();

  if (typeValue.includes("success") || typeValue.includes("complete")) {
    return "checkCircle";
  }

  if (typeValue.includes("warning") || typeValue.includes("urgent") || typeValue.includes("error")) {
    return "warning";
  }

  if (kind === "mentor") {
    return "forum";
  }

  if (kind === "course") {
    return "school";
  }

  return "info";
}

function mapNotification(notification: BackendNotificationResponse): NotificationItem {
  const metadata = isRecord(notification.metadata) ? notification.metadata : undefined;
  const kind = inferNotificationKind(notification);

  return {
    id: notification.id,
    title: notification.title,
    description: notification.message,
    time: toRelativeTimeLabel(notification.createdAt),
    kind,
    icon: inferNotificationIcon(notification, kind),
    tone: inferNotificationTone(notification, kind),
    unread: !notification.isRead,
    quote: readMetadataString(metadata, "quote"),
    actionLabel: readMetadataString(metadata, "actionLabel"),
    actionHref: readMetadataString(metadata, "actionHref"),
  };
}

export async function fetchMyNotifications() {
  const response = await requestAuthenticatedApiJson<BackendNotificationResponse[]>(
    "/api/notifications/me",
    {
      method: "GET",
    },
    "Unable to load your notifications.",
  );

  return response.map(mapNotification);
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await requestAuthenticatedApiJson<BackendNotificationResponse>(
    `/api/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    },
    "Unable to mark this notification as read.",
  );

  return mapNotification(response);
}
