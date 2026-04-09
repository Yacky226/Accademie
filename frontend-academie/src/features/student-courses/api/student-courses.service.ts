import { requestApiJson } from "@/core/api/api-http-client";
import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type {
  BackendCourseResponse,
  BackendEnrollmentResponse,
  StudentCourseRecommendationCard,
  StudentEnrolledCourseCard,
} from "../model/student-courses.types";

const COURSE_PLACEHOLDER_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDWqX6hzcwolSYlt1iCvyma8yxsI4yxF_JpoDQaRchF10csHHXhkjLidP8kz6-mm4oUFfGW4iVHVGoFjBPyVPyGk4X1J2yetH3LzKLFO5sz6twmhPH_fJUaDIAKZl-fyQziqmEPijdPQ0ULVISN_fKIZJgKWa3LsctIheSVIdKOgOSDrOsGlklADjGunL-Ah7nkdfk_B7c3SUv3vcM4h5PI-Rzd49Ix2tlF13DIfiLQNZRBHog5VO325U4ls0ToqiCltl5XlrspPW_X",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPvucqwUiZhzEQF_bjyXt4si66i4rifvri1aUk2HlbkoTpOHWG4fDQ7aiXpJrzqIJYvEiJ-jqPH13I7OUmp95hLf6mjOGUTt2QwGpLwuMH5jTiq13F9JrqxiVNflx5fRcGmaa4IE7_QMcY3q64qhd6DWXkTep3rbk1EhLHrXbWwTsN0Qa0xBNlydYFrH1idKgl7Bt8ds8gpbY1gtiuBY0L0-adtYYr4heN0Oby015ukNpFJq2fuklLSipjDcQZgmlkbuT4mPOiFAWI",
];

function formatCourseLevel(level: string) {
  const normalizedLevel = level.trim().toLowerCase();

  if (normalizedLevel === "beginner") {
    return "Beginner";
  }

  if (normalizedLevel === "intermediate") {
    return "Intermediate";
  }

  if (normalizedLevel === "advanced") {
    return "Advanced";
  }

  return level;
}

function buildHoursLabel(durationInHours: number | undefined) {
  if (!durationInHours || durationInHours <= 0) {
    return "Flexible";
  }

  return `${durationInHours} Heures`;
}

function fallbackImage(id: string) {
  const imageIndex =
    Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0) %
    COURSE_PLACEHOLDER_IMAGES.length;

  return COURSE_PLACEHOLDER_IMAGES[imageIndex];
}

function buildMentorName(creator: BackendCourseResponse["creator"]) {
  return `${creator.firstName} ${creator.lastName}`.trim();
}

function mapCourseRecommendation(course: BackendCourseResponse): StudentCourseRecommendationCard {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    level: formatCourseLevel(course.level),
    hours: buildHoursLabel(course.durationInHours),
    description: course.shortDescription || course.description,
    imageUrl: course.thumbnailUrl || fallbackImage(course.id),
    mentor: buildMentorName(course.creator),
    catalogHref: `/formations/${course.slug}`,
  };
}

function mapEnrollment(enrollment: BackendEnrollmentResponse): StudentEnrolledCourseCard {
  return {
    id: enrollment.id,
    courseId: enrollment.course.id,
    slug: enrollment.course.slug,
    title: enrollment.course.title,
    mentor: enrollment.course.creatorName || "Architect Academy Mentor",
    progress: Number.parseFloat(enrollment.progressPercent) || 0,
    nextLesson: enrollment.course.nextLessonTitle || "Planifier la prochaine lecon",
    status: enrollment.status,
    imageUrl: enrollment.course.thumbnailUrl || fallbackImage(enrollment.course.id),
    shortDescription:
      enrollment.course.shortDescription || "Continuez votre progression sur ce parcours.",
  };
}

export async function fetchStudentCourseCatalog() {
  const response = await requestApiJson<BackendCourseResponse[]>(
    "/api/courses/catalog",
    {
      method: "GET",
    },
    "Unable to load the course catalog.",
  );

  return response.map(mapCourseRecommendation);
}

export async function fetchMyStudentEnrollments() {
  const response = await requestAuthenticatedApiJson<BackendEnrollmentResponse[]>(
    "/api/courses/enrollments/me",
    {
      method: "GET",
    },
    "Unable to load your active courses.",
  );

  return response.map(mapEnrollment);
}

export async function fetchMyRecommendedCourses() {
  const response = await requestAuthenticatedApiJson<BackendCourseResponse[]>(
    "/api/courses/recommendations/me",
    {
      method: "GET",
    },
    "Unable to load personalized course recommendations.",
  );

  return response.map(mapCourseRecommendation);
}

export async function enrollInCourse(courseId: string) {
  const response = await requestAuthenticatedApiJson<BackendEnrollmentResponse>(
    `/api/courses/${courseId}/enrollments/me`,
    {
      method: "POST",
    },
    "Unable to enroll in this course right now.",
  );

  return mapEnrollment(response);
}
