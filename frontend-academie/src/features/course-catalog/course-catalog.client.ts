import { requestApiJson } from "@/core/api/api-http-client";
import { resolveApiAssetUrl } from "@/core/config/application-environment";
import type {
  CatalogCourseDetailRecord,
  CatalogCourseRecord,
} from "./course-catalog.types";

type BackendCatalogCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  price: string;
  currency: string;
  level: string;
  durationInHours?: number;
  enrollmentsCount: number;
  creator: {
    firstName: string;
    lastName: string;
  };
  modules: Array<{
    id: string;
    title: string;
    description?: string;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      durationInMinutes?: number;
      isFreePreview: boolean;
    }>;
  }>;
};

function formatLevelLabel(level: string) {
  const normalized = level.trim().toLowerCase();

  if (normalized === "beginner") {
    return "Debutant";
  }

  if (normalized === "intermediate") {
    return "Intermediaire";
  }

  if (normalized === "advanced") {
    return "Avance";
  }

  return level;
}

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

function mapCourse(value: BackendCatalogCourse): CatalogCourseRecord {
  const mentorName = `${value.creator.firstName} ${value.creator.lastName}`.trim();

  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    shortDescription: value.shortDescription,
    description: value.description,
    thumbnailUrl: resolveApiAssetUrl(value.thumbnailUrl ?? null),
    price: readNumber(value.price),
    currency: value.currency,
    level: formatLevelLabel(value.level),
    durationInHours: value.durationInHours ?? null,
    enrollmentsCount: value.enrollmentsCount,
    mentorName,
    categoryLabel: formatLevelLabel(value.level),
  };
}

function mapCourseDetail(value: BackendCatalogCourse): CatalogCourseDetailRecord {
  return {
    ...mapCourse(value),
    modules: (value.modules ?? []).map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description ?? "",
      position: module.position,
      lessons: (module.lessons ?? []).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        durationInMinutes: lesson.durationInMinutes ?? null,
        isFreePreview: lesson.isFreePreview,
      })),
    })),
  };
}

export async function fetchCatalogCourses() {
  const response = await requestApiJson<BackendCatalogCourse[]>(
    "/api/courses/catalog",
    { method: "GET" },
    "Impossible de charger le catalogue.",
  );

  return response.map(mapCourse);
}

export async function fetchCatalogCourseBySlug(slug: string) {
  const response = await requestApiJson<BackendCatalogCourse>(
    `/api/courses/catalog/${slug}`,
    { method: "GET" },
    "Impossible de charger cette formation.",
  );

  return mapCourseDetail(response);
}
