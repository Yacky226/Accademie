"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/core/store/app-store-hooks";
import {
  fetchNotificationCenterThunk,
  markAllNotificationsAsReadThunk,
  markNotificationAsReadThunk,
} from "./model/notification-center.slice";
import {
  selectNotificationError,
  selectNotificationItems,
  selectNotificationStatus,
} from "./model/notification-center.selectors";

export function useNotificationCenterState() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectNotificationItems);
  const status = useAppSelector(selectNotificationStatus);
  const errorMessage = useAppSelector(selectNotificationError);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchNotificationCenterThunk());
    }
  }, [dispatch, status]);

  const unreadCount = items.reduce((count, item) => count + (item.unread ? 1 : 0), 0);

  function isUnread(id: string) {
    return items.some((item) => item.id === id && item.unread);
  }

  function markAsRead(id: string) {
    if (!isUnread(id)) {
      return;
    }

    void dispatch(markNotificationAsReadThunk(id));
  }

  function markAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    void dispatch(markAllNotificationsAsReadThunk());
  }

  return {
    errorMessage,
    isUnread,
    items,
    markAllAsRead,
    markAsRead,
    status,
    unreadCount,
  };
}
