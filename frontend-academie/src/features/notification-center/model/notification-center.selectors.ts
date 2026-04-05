import type { RootState } from "@/core/store/app-store";

export const selectNotificationCenterState = (state: RootState) => state.notificationCenter;
export const selectNotificationItems = (state: RootState) => state.notificationCenter.items;
export const selectNotificationStatus = (state: RootState) => state.notificationCenter.status;
export const selectNotificationError = (state: RootState) =>
  state.notificationCenter.errorMessage;
