import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth/model/auth.slice";
import { notificationCenterReducer } from "@/features/notification-center/model/notification-center.slice";
import { studentCodeEditorReducer } from "@/features/student-code-editor/model/student-code-editor.slice";
import { studentCoursesReducer } from "@/features/student-courses/model/student-courses.slice";

const rootReducer = combineReducers({
  auth: authReducer,
  notificationCenter: notificationCenterReducer,
  studentCodeEditor: studentCodeEditorReducer,
  studentCourses: studentCoursesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function createAppStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore["dispatch"];
