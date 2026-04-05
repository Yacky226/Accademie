export interface BackendCourseResponse {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  price: string;
  currency: string;
  level: string;
  status: string;
  isPublished: boolean;
  durationInHours?: number;
  certificateEnabled: boolean;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  modules: Array<{
    id: string;
    title: string;
    description?: string;
    position: number;
    isPublished: boolean;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      durationInMinutes?: number;
      position: number;
      isFreePreview: boolean;
      isPublished: boolean;
    }>;
  }>;
  enrollmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendEnrollmentResponse {
  id: string;
  status: string;
  progressPercent: string;
  startedAt?: string;
  completedAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription?: string;
    thumbnailUrl?: string;
    creatorName?: string;
    durationInHours?: number;
    nextLessonTitle?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudentCourseRecommendationCard {
  id: string;
  slug: string;
  title: string;
  level: string;
  hours: string;
  description: string;
  imageUrl: string;
  mentor: string;
  catalogHref: string;
}

export interface StudentEnrolledCourseCard {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  mentor: string;
  progress: number;
  nextLesson: string;
  status: string;
  imageUrl: string;
  shortDescription: string;
}

export interface StudentCoursesState {
  catalog: StudentCourseRecommendationCard[];
  recommendations: StudentCourseRecommendationCard[];
  enrollments: StudentEnrolledCourseCard[];
  errorMessage: string | null;
  pendingEnrollmentCourseId: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}
