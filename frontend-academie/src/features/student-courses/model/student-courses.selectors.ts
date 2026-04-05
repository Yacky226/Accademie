import type { RootState } from "@/core/store/app-store";

export const selectStudentCoursesState = (state: RootState) => state.studentCourses;
export const selectStudentCourseCatalog = (state: RootState) => state.studentCourses.catalog;
export const selectStudentCourseRecommendations = (state: RootState) =>
  state.studentCourses.recommendations;
export const selectStudentEnrollments = (state: RootState) => state.studentCourses.enrollments;
export const selectStudentCoursesStatus = (state: RootState) => state.studentCourses.status;
export const selectStudentCoursesError = (state: RootState) => state.studentCourses.errorMessage;
export const selectPendingEnrollmentCourseId = (state: RootState) =>
  state.studentCourses.pendingEnrollmentCourseId;
