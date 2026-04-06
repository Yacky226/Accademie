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

export interface NotificationToast {
  id: string;
  title: string;
  description: string;
  tone: NotificationTone;
  icon: NotificationIconName;
  actionLabel?: string;
}

export const notificationFilters: NotificationFilter[] = [
  { id: "all", label: "All" },
  { id: "course", label: "Course Updates" },
  { id: "mentor", label: "Mentor Feedback" },
  { id: "system", label: "System Alerts" },
];

export const notificationItems: NotificationItem[] = [
  {
    id: "mentor-feedback",
    title: "Mentor Feedback Received",
    description:
      'Sarah Jenkins left a comment on your "Modern Skyscrapers" structural analysis project.',
    time: "2m ago",
    kind: "mentor",
    icon: "forum",
    tone: "primary",
    unread: true,
    quote:
      "Great use of load-bearing columns here, but consider the wind-shear factors on the north facade.",
  },
  {
    id: "new-module",
    title: "New Module Available",
    description:
      "Advanced Parametric Design is now open for enrollment in your curriculum path.",
    time: "1h ago",
    kind: "course",
    icon: "school",
    tone: "tertiary",
    unread: true,
  },
  {
    id: "subscription-expiring",
    title: "Subscription Expiring",
    description:
      "Your Architect Pro subscription ends in 3 days. Renew now to avoid losing progress.",
    time: "5h ago",
    kind: "system",
    icon: "warning",
    tone: "error",
    unread: true,
    actionLabel: "Renew Subscription",
    actionHref: "/pricing",
  },
  {
    id: "design-exported",
    title: "Design Exported",
    description: "Your latest studio blueprints are ready for download from the project hub.",
    time: "12h ago",
    kind: "system",
    icon: "checkCircle",
    tone: "success",
  },
  {
    id: "mentor-live-review",
    title: "Live Review Scheduled",
    description: "David Chipperfield will review your concept board tomorrow at 14:00.",
    time: "1d ago",
    kind: "mentor",
    icon: "info",
    tone: "info",
    actionLabel: "Open Calendar",
    actionHref: "/student/calendar",
  },
  {
    id: "curriculum-sync",
    title: "Curriculum Path Updated",
    description: "Three new systems-thinking exercises were added to your weekly plan.",
    time: "2d ago",
    kind: "course",
    icon: "school",
    tone: "primary",
  },
];

export const notificationToasts: NotificationToast[] = [
  {
    id: "toast-export",
    title: "Design Exported",
    description: "Your blueprints are ready for download.",
    tone: "success",
    icon: "checkCircle",
  },
  {
    id: "toast-mentor",
    title: "New Mentor Online",
    description: "David Chipperfield is now available for live review.",
    tone: "info",
    icon: "info",
  },
  {
    id: "toast-upload",
    title: "Upload Failed",
    description: "File size exceeds the 50MB limit.",
    tone: "error",
    icon: "warning",
    actionLabel: "Retry",
  },
  {
    id: "toast-network",
    title: "Network Unstable",
    description: "Syncing may be delayed. Keep this tab open.",
    tone: "tertiary",
    icon: "warning",
  },
];
