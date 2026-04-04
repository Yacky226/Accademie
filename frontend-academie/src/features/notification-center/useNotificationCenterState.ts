"use client";

import { useSyncExternalStore } from "react";
import { notificationItems } from "./notification-center.data";

const STORAGE_KEY = "aa_notification_read_ids";
const EMPTY_READ_IDS: string[] = [];

type StoreListener = () => void;

const listeners = new Set<StoreListener>();
let storageListenerAttached = false;
let currentReadIds: string[] = EMPTY_READ_IDS;
let hydratedFromStorage = false;

function readStoredReadIds() {
  if (typeof window === "undefined") {
    return EMPTY_READ_IDS;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsed)) {
      return EMPTY_READ_IDS;
    }

    const filtered = parsed.filter((value): value is string => typeof value === "string");
    return filtered.length === 0 ? EMPTY_READ_IDS : filtered;
  } catch {
    return EMPTY_READ_IDS;
  }
}

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function emitStoreChange() {
  listeners.forEach((listener) => listener());
}

function ensureHydratedSnapshot() {
  if (hydratedFromStorage || typeof window === "undefined") {
    return;
  }

  currentReadIds = readStoredReadIds();
  hydratedFromStorage = true;
}

function setSnapshot(nextReadIds: string[]) {
  if (arraysEqual(currentReadIds, nextReadIds)) {
    return;
  }

  currentReadIds = nextReadIds;
  emitStoreChange();
}

function writeReadIds(nextReadIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  ensureHydratedSnapshot();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReadIds));
  setSnapshot(nextReadIds);
}

function subscribe(listener: StoreListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureHydratedSnapshot();
  return currentReadIds;
}

function getServerSnapshot() {
  return EMPTY_READ_IDS;
}

if (typeof window !== "undefined" && !storageListenerAttached) {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      hydratedFromStorage = true;
      setSnapshot(readStoredReadIds());
    }
  });
  storageListenerAttached = true;
}

export function useNotificationCenterState() {
  const readIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const unreadCount = notificationItems.reduce((count, item) => {
    if (item.unread && !readIds.includes(item.id)) {
      return count + 1;
    }

    return count;
  }, 0);

  function isUnread(id: string) {
    const item = notificationItems.find((entry) => entry.id === id);
    return Boolean(item?.unread) && !readIds.includes(id);
  }

  function markAsRead(id: string) {
    if (readIds.includes(id)) {
      return;
    }

    writeReadIds([...readIds, id]);
  }

  function markAllAsRead() {
    const allUnreadIds = notificationItems
      .filter((item) => item.unread)
      .map((item) => item.id);

    writeReadIds(allUnreadIds);
  }

  return {
    isUnread,
    markAllAsRead,
    markAsRead,
    readIds,
    unreadCount,
  };
}
