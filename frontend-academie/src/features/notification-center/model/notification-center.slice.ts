import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { notificationItems } from "../notification-center.data";
import {
  fetchMyNotifications,
  markNotificationAsRead,
} from "../api/notification-center.service";
import type { NotificationCenterState } from "./notification-center.types";

const initialState: NotificationCenterState = {
  errorMessage: null,
  items: notificationItems,
  status: "idle",
};

export const fetchNotificationCenterThunk = createAsyncThunk<
  typeof notificationItems,
  void,
  { rejectValue: string }
>("notificationCenter/fetchMine", async (_, { rejectWithValue }) => {
  try {
    return await fetchMyNotifications();
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to load your notifications.",
    );
  }
});

export const markNotificationAsReadThunk = createAsyncThunk<
  (typeof notificationItems)[number],
  string,
  { rejectValue: string }
>("notificationCenter/markAsRead", async (notificationId, { rejectWithValue }) => {
  try {
    return await markNotificationAsRead(notificationId);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to mark this notification as read.",
    );
  }
});

export const markAllNotificationsAsReadThunk = createAsyncThunk<
  string[],
  void,
  { state: { notificationCenter: NotificationCenterState }; rejectValue: string }
>("notificationCenter/markAllAsRead", async (_, { getState, rejectWithValue }) => {
  try {
    const unreadIds = getState().notificationCenter.items
      .filter((item) => item.unread)
      .map((item) => item.id);

    if (unreadIds.length === 0) {
      return [];
    }

    await Promise.all(unreadIds.map((notificationId) => markNotificationAsRead(notificationId)));
    return unreadIds;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to mark all notifications as read.",
    );
  }
});

const notificationCenterSlice = createSlice({
  name: "notificationCenter",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchNotificationCenterThunk.pending, (state) => {
        state.errorMessage = null;
        state.status = "loading";
      })
      .addCase(fetchNotificationCenterThunk.fulfilled, (state, action) => {
        state.errorMessage = null;
        state.items = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchNotificationCenterThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? "Unable to load your notifications.";
        state.status = "failed";
      })
      .addCase(markNotificationAsReadThunk.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(markNotificationAsReadThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to mark this notification as read.";
      })
      .addCase(markAllNotificationsAsReadThunk.fulfilled, (state, action) => {
        if (action.payload.length === 0) {
          return;
        }

        state.items = state.items.map((item) =>
          action.payload.includes(item.id) ? { ...item, unread: false } : item,
        );
      })
      .addCase(markAllNotificationsAsReadThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to mark all notifications as read.";
      });
  },
});

export const notificationCenterReducer = notificationCenterSlice.reducer;
