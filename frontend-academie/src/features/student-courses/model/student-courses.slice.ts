import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { dashboardRecommendations } from "@/features/student-space/student-space.data";
import {
  enrollInCourse,
  fetchMyStudentEnrollments,
  fetchStudentCourseCatalog,
} from "../api/student-courses.service";
import type {
  StudentCourseRecommendationCard,
  StudentCoursesState,
  StudentEnrolledCourseCard,
} from "./student-courses.types";

const fallbackRecommendations: StudentCourseRecommendationCard[] = dashboardRecommendations.map(
  (course, index) => ({
    id: `fallback-course-${index + 1}`,
    slug: `fallback-course-${index + 1}`,
    title: course.title,
    level: course.level,
    hours: course.hours,
    description: course.description,
    imageUrl: course.imageUrl,
    mentor: "Architect Academy Mentor",
    catalogHref: "/formations",
  }),
);

const initialState: StudentCoursesState = {
  catalog: fallbackRecommendations,
  recommendations: fallbackRecommendations,
  enrollments: [],
  errorMessage: null,
  pendingEnrollmentCourseId: null,
  status: "idle",
};

export const fetchStudentCoursesThunk = createAsyncThunk<
  {
    catalog: StudentCourseRecommendationCard[];
    enrollments: StudentEnrolledCourseCard[];
    recommendations: StudentCourseRecommendationCard[];
  },
  void,
  { rejectValue: string }
>("studentCourses/fetchDashboard", async (_, { rejectWithValue }) => {
  try {
    const [catalog, enrollments] = await Promise.all([
      fetchStudentCourseCatalog(),
      fetchMyStudentEnrollments(),
    ]);

    return {
      catalog,
      enrollments,
      recommendations: catalog.slice(0, 4),
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to load student courses.",
    );
  }
});

export const enrollInCourseThunk = createAsyncThunk<
  StudentEnrolledCourseCard,
  string,
  { rejectValue: string }
>("studentCourses/enroll", async (courseId, { rejectWithValue }) => {
  try {
    return await enrollInCourse(courseId);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to enroll in this course.",
    );
  }
});

const studentCoursesSlice = createSlice({
  name: "studentCourses",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchStudentCoursesThunk.pending, (state) => {
        state.errorMessage = null;
        state.status = "loading";
      })
      .addCase(fetchStudentCoursesThunk.fulfilled, (state, action) => {
        state.catalog = action.payload.catalog;
        state.enrollments = action.payload.enrollments;
        state.recommendations = action.payload.recommendations;
        state.errorMessage = null;
        state.status = "succeeded";
      })
      .addCase(fetchStudentCoursesThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? "Unable to load student courses.";
        state.recommendations = fallbackRecommendations;
        state.status = "failed";
      })
      .addCase(enrollInCourseThunk.pending, (state, action) => {
        state.errorMessage = null;
        state.pendingEnrollmentCourseId = action.meta.arg;
      })
      .addCase(enrollInCourseThunk.fulfilled, (state, action) => {
        const existingEnrollmentIndex = state.enrollments.findIndex(
          (enrollment) => enrollment.courseId === action.payload.courseId,
        );

        if (existingEnrollmentIndex >= 0) {
          state.enrollments[existingEnrollmentIndex] = action.payload;
        } else {
          state.enrollments.unshift(action.payload);
        }

        state.pendingEnrollmentCourseId = null;
      })
      .addCase(enrollInCourseThunk.rejected, (state, action) => {
        state.errorMessage = action.payload ?? "Unable to enroll in this course.";
        state.pendingEnrollmentCourseId = null;
      });
  },
});

export const studentCoursesReducer = studentCoursesSlice.reducer;
