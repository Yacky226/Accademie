import { buildApiUrl } from "@/core/config/application-environment";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function parseApiResponsePayload(response: Response) {
  const rawPayload = await response.text();
  if (!rawPayload.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawPayload) as unknown;
  } catch {
    return rawPayload;
  }
}

function extractArrayMessage(items: unknown[]) {
  const message = items
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .join(" ");

  return message.trim() || null;
}

function extractApiErrorMessage(payload: unknown, fallbackMessage: string) {
  if (Array.isArray(payload)) {
    return extractArrayMessage(payload) ?? fallbackMessage;
  }

  if (!isRecord(payload)) {
    return fallbackMessage;
  }

  const directMessage = payload.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  if (Array.isArray(directMessage)) {
    return extractArrayMessage(directMessage) ?? fallbackMessage;
  }

  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  return fallbackMessage;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export async function requestApiJson<TResponse>(
  path: string,
  options: RequestInit,
  fallbackMessage: string,
) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const payload = await parseApiResponsePayload(response);

  if (!response.ok) {
    throw new ApiClientError(
      extractApiErrorMessage(payload, fallbackMessage),
      response.status,
      payload,
    );
  }

  return payload as TResponse;
}
