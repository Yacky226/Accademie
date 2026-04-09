export type NotificationFilterId = "all" | "course" | "mentor" | "system";

export type NotificationTone =
  | "primary"
  | "tertiary"
  | "error"
  | "success"
  | "info";

export type NotificationIconName =
  | "checkCircle"
  | "forum"
  | "info"
  | "school"
  | "warning";

export interface NotificationFilter {
  id: NotificationFilterId;
  label: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  kind: Exclude<NotificationFilterId, "all">;
  icon: NotificationIconName;
  tone: NotificationTone;
  unread?: boolean;
  quote?: string;
  actionLabel?: string;
  actionHref?: string;
}

export const notificationFilters: NotificationFilter[] = [
  { id: "all", label: "All" },
  { id: "course", label: "Course Updates" },
  { id: "mentor", label: "Mentor Feedback" },
  { id: "system", label: "System Alerts" },
];
