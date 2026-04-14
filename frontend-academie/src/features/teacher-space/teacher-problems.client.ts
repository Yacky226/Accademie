import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type {
  CreateTeacherProblemPayload,
  CreateTeacherProblemTagPayload,
  CreateTeacherProblemTestCasePayload,
  TeacherProblemRecord,
  TeacherProblemTagRecord,
  TeacherSupportedLanguageRecord,
  UpdateTeacherProblemPayload,
} from "./teacher-space.types";

export async function fetchTeacherProblems() {
  return requestAuthenticatedApiJson<TeacherProblemRecord[]>(
    "/api/problems",
    { method: "GET" },
    "Impossible de charger les problemes.",
  );
}

export async function createTeacherProblem(
  payload: CreateTeacherProblemPayload,
) {
  return requestAuthenticatedApiJson<TeacherProblemRecord>(
    "/api/problems",
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
    "Impossible de creer ce probleme.",
  );
}

export async function updateTeacherProblem(
  problemId: string,
  payload: UpdateTeacherProblemPayload,
) {
  return requestAuthenticatedApiJson<TeacherProblemRecord>(
    `/api/problems/${problemId}`,
    {
      body: JSON.stringify(payload),
      method: "PATCH",
    },
    "Impossible de mettre a jour ce probleme.",
  );
}

export async function fetchTeacherProblemTags() {
  return requestAuthenticatedApiJson<TeacherProblemTagRecord[]>(
    "/api/problems/tags/all",
    { method: "GET" },
    "Impossible de charger les tags de problemes.",
  );
}

export async function createTeacherProblemTag(
  payload: CreateTeacherProblemTagPayload,
) {
  return requestAuthenticatedApiJson<TeacherProblemTagRecord>(
    "/api/problems/tags",
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
    "Impossible de creer ce tag.",
  );
}

export async function attachTeacherProblemTag(
  problemId: string,
  tagId: string,
) {
  return requestAuthenticatedApiJson<TeacherProblemRecord>(
    `/api/problems/${problemId}/tags/${tagId}`,
    { method: "POST" },
    "Impossible d ajouter ce tag au probleme.",
  );
}

export async function detachTeacherProblemTag(
  problemId: string,
  tagId: string,
) {
  return requestAuthenticatedApiJson<TeacherProblemRecord>(
    `/api/problems/${problemId}/tags/${tagId}`,
    { method: "DELETE" },
    "Impossible de retirer ce tag du probleme.",
  );
}

export async function createTeacherProblemTestCase(
  problemId: string,
  payload: CreateTeacherProblemTestCasePayload,
) {
  return requestAuthenticatedApiJson(
    `/api/problems/${problemId}/test-cases`,
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
    "Impossible d ajouter ce test case.",
  );
}

export async function deleteTeacherProblemTestCase(
  problemId: string,
  testCaseId: string,
) {
  return requestAuthenticatedApiJson<void>(
    `/api/problems/${problemId}/test-cases/${testCaseId}`,
    { method: "DELETE" },
    "Impossible de supprimer ce test case.",
  );
}

export async function fetchTeacherSupportedLanguages() {
  return requestAuthenticatedApiJson<TeacherSupportedLanguageRecord[]>(
    "/api/problems/languages/all",
    { method: "GET" },
    "Impossible de charger les runtimes disponibles.",
  );
}
