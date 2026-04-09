import { resolveApiAssetUrl } from "@/core/config/application-environment";
import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type {
  OnboardingProfile,
  UpdateUserProfilePayload,
  UserProfile,
} from "../model/user-profile.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractData(payload: unknown) {
  if (!isRecord(payload)) {
    return {};
  }

  if (isRecord(payload.data)) {
    return payload.data;
  }

  return payload;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function mapOnboardingProfile(value: unknown): OnboardingProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    fullName: readString(value.fullName) || undefined,
    email: readString(value.email) || undefined,
    primaryLanguage: readString(value.primaryLanguage) || undefined,
    currentRole: readString(value.currentRole) || undefined,
    yearsOfExperience: readString(value.yearsOfExperience) || undefined,
    dailyCodingTime: readString(value.dailyCodingTime) || undefined,
    primaryGoal: readString(value.primaryGoal) || undefined,
    targetStack: readString(value.targetStack) || undefined,
    weeklyCommitment: readString(value.weeklyCommitment) || undefined,
    preferredCohortPace: readString(value.preferredCohortPace) || undefined,
    mentorInteractionMode: readString(value.mentorInteractionMode) || undefined,
    timezone: readString(value.timezone) || undefined,
  };
}

function mapRoleNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim().toLowerCase();
      }

      if (isRecord(entry) && typeof entry.name === "string") {
        return entry.name.trim().toLowerCase();
      }

      return "";
    })
    .filter(Boolean);
}

function mapUserProfile(payload: unknown): UserProfile {
  const data = extractData(payload);

  return {
    id: readString(data.id),
    firstName: readString(data.firstName),
    lastName: readString(data.lastName),
    fullName: `${readString(data.firstName)} ${readString(data.lastName)}`.trim(),
    email: readString(data.email),
    phone: readString(data.phone),
    avatarUrl: resolveApiAssetUrl(readString(data.avatarUrl) || null),
    bio: readString(data.bio),
    city: readString(data.city),
    country: readString(data.country),
    roles: mapRoleNames(data.roles),
    onboardingProfile: mapOnboardingProfile(data.onboardingProfile),
    onboardingCompletedAt: readString(data.onboardingCompletedAt) || null,
    emailVerified: Boolean(data.emailVerified),
    lastLoginAt: readString(data.lastLoginAt) || null,
    createdAt: readString(data.createdAt) || null,
    updatedAt: readString(data.updatedAt) || null,
  };
}

export async function fetchCurrentUserProfile() {
  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/users/me",
    {
      method: "GET",
    },
    "Impossible de charger votre profil.",
  );

  return mapUserProfile(response);
}

export async function updateCurrentUserProfile(payload: UpdateUserProfilePayload) {
  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/users/me",
    {
      body: JSON.stringify({
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        city: payload.city.trim(),
        country: payload.country.trim(),
        bio: payload.bio.trim(),
      }),
      method: "PATCH",
    },
    "Impossible de mettre a jour votre profil.",
  );

  return mapUserProfile(response);
}

export async function uploadCurrentUserAvatar(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/users/me/avatar",
    {
      body: formData,
      method: "POST",
    },
    "Impossible d envoyer votre photo de profil.",
  );

  return mapUserProfile(response);
}

export async function syncCurrentUserOnboarding(input: {
  onboardingProfile: OnboardingProfile;
  onboardingCompletedAt?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/users/me",
    {
      body: JSON.stringify({
        onboardingProfile: input.onboardingProfile,
        onboardingCompletedAt: input.onboardingCompletedAt ?? undefined,
        firstName: input.firstName?.trim() || undefined,
        lastName: input.lastName?.trim() || undefined,
        email: input.email?.trim() || undefined,
      }),
      method: "PATCH",
    },
    "Impossible de synchroniser votre onboarding.",
  );

  return mapUserProfile(response);
}
