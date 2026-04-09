import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import { resolveApiAssetUrl } from "@/core/config/application-environment";

export interface LessonCourseRecord {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string | null;
  progressPercent: number;
  modules: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      content: string;
      videoUrl: string | null;
      resourceUrl: string | null;
      durationInMinutes: number | null;
      position: number;
      isFreePreview: boolean;
      isPublished: boolean;
    }>;
  }>;
}

type BackendCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  modules: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      content?: string;
      videoUrl?: string;
      resourceUrl?: string;
      durationInMinutes?: number;
      position: number;
      isFreePreview: boolean;
      isPublished: boolean;
    }>;
  }>;
};

type BackendEnrollment = {
  progressPercent: string;
};

function readNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function fetchMyCourseLessonView(slug: string) {
  const [course, enrollments] = await Promise.all([
    requestAuthenticatedApiJson<BackendCourse>(
      `/api/courses/enrollments/me/course/${slug}`,
      { method: "GET" },
      "Impossible de charger ce cours.",
    ),
    requestAuthenticatedApiJson<
      Array<{ course: { slug: string }; progressPercent: string }>
    >(
      "/api/courses/enrollments/me",
      { method: "GET" },
      "Impossible de charger votre progression.",
    ),
  ]);

  const enrollment = enrollments.find((item) => item.course.slug === slug);

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription,
    description: course.description,
    thumbnailUrl: resolveApiAssetUrl(course.thumbnailUrl ?? null),
    progressPercent: readNumber(enrollment?.progressPercent),
    modules: (course.modules ?? []).map((module) => ({
      id: module.id,
      title: module.title,
      position: module.position,
      lessons: (module.lessons ?? []).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        content: lesson.content ?? "",
        videoUrl: resolveApiAssetUrl(lesson.videoUrl ?? null),
        resourceUrl: resolveApiAssetUrl(lesson.resourceUrl ?? null),
        durationInMinutes: lesson.durationInMinutes ?? null,
        position: lesson.position,
        isFreePreview: lesson.isFreePreview,
        isPublished: lesson.isPublished,
      })),
    })),
  } satisfies LessonCourseRecord;
}

export async function updateMyCourseProgress(slug: string, progressPercent: number) {
  const response = await requestAuthenticatedApiJson<BackendEnrollment>(
    `/api/courses/enrollments/me/course/${slug}/progress`,
    {
      method: "PATCH",
      body: JSON.stringify({
        progressPercent,
      }),
    },
    "Impossible de mettre a jour la progression.",
  );

  return readNumber(response.progressPercent);
}
