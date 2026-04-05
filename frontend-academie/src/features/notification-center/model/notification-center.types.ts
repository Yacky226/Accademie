import type { NotificationItem } from "../notification-center.data";

export interface BackendNotificationResponse {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCenterState {
  errorMessage: string | null;
  items: NotificationItem[];
  status: "idle" | "loading" | "succeeded" | "failed";
}
