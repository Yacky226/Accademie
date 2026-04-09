import { requestApiJson } from "@/core/api/api-http-client";

interface BackendAcademySetting {
  key?: string;
  value?: string;
}

interface BackendContactRequest {
  id?: string;
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketingContactRequestPayload {
  email: string;
  fullName: string;
  message: string;
  subject: string;
}

export interface MarketingContactRequestRecord {
  createdAt: string | null;
  email: string;
  fullName: string;
  id: string;
  message: string;
  status: string;
  subject: string;
  updatedAt: string | null;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function mapContactRequest(
  response: BackendContactRequest,
): MarketingContactRequestRecord {
  return {
    createdAt: typeof response.createdAt === "string" ? response.createdAt : null,
    email: readString(response.email),
    fullName: readString(response.fullName),
    id: readString(response.id),
    message: readString(response.message),
    status: readString(response.status, "NEW"),
    subject: readString(response.subject),
    updatedAt: typeof response.updatedAt === "string" ? response.updatedAt : null,
  };
}

export async function createMarketingContactRequest(
  payload: MarketingContactRequestPayload,
) {
  const response = await requestApiJson<BackendContactRequest>(
    "/api/contact-requests",
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
    "Impossible d envoyer votre demande pour le moment.",
  );

  return mapContactRequest(response);
}

export async function fetchMarketingPublicSettings() {
  const response = await requestApiJson<BackendAcademySetting[]>(
    "/api/academy/settings/public",
    {
      method: "GET",
    },
    "Impossible de charger la configuration publique.",
  );

  return new Map(
    response.map((setting) => [readString(setting.key), readString(setting.value)]),
  );
}
