import { requestApiJson } from "@/core/api/api-http-client";
import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type {
  StudentCodingExercise,
  StudentCodingLanguage,
  StudentCodingLanguageId,
} from "../model/student-code-editor.contracts";
import { studentCodeExercise } from "../model/student-code-editor.catalog";
import type {
  BackendJudgeRunResponse,
  BackendProblemResponse,
  BackendSubmissionResponse,
  BackendSupportedLanguage,
  RunCodePayload,
  StudentCodeExecutionRecord,
  SubmitCodePayload,
} from "../model/student-code-editor.types";

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function splitConstraintText(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return [];
  }

  return rawValue
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDifficulty(difficulty: string) {
  const normalizedDifficulty = normalizeValue(difficulty);

  if (normalizedDifficulty === "easy") {
    return "Facile";
  }

  if (normalizedDifficulty === "medium") {
    return "Moyen";
  }

  if (normalizedDifficulty === "hard") {
    return "Difficile";
  }

  return difficulty;
}

function matchLocalLanguageId(
  language: BackendSupportedLanguage,
): StudentCodingLanguageId | null {
  const normalizedName = `${language.name} ${language.slug}`.toLowerCase();

  if (normalizedName.includes("python")) {
    return "python";
  }

  if (
    normalizedName.includes("typescript") ||
    normalizedName.includes("node")
  ) {
    return "typescript";
  }

  if (
    normalizedName.includes("java") &&
    !normalizedName.includes("javascript")
  ) {
    return "java";
  }

  if (
    normalizedName.includes("c++") ||
    normalizedName.includes("cpp") ||
    normalizedName.includes("gcc")
  ) {
    return "cpp";
  }

  return null;
}

function pickPreferredProblem(problems: BackendProblemResponse[]) {
  if (problems.length === 0) {
    return null;
  }

  const matchingProblem = problems.find((problem) => {
    const normalizedTitle = normalizeValue(problem.title);
    return (
      normalizedTitle.includes("invert") ||
      normalizedTitle.includes("inversion")
    );
  });

  return matchingProblem ?? problems[0];
}

function buildExerciseLanguages(
  languages: BackendSupportedLanguage[],
): StudentCodingExercise["languages"] {
  const backendLanguageByLocalId = new Map<
    StudentCodingLanguageId,
    BackendSupportedLanguage
  >();

  languages
    .filter((language) => language.isActive)
    .forEach((language) => {
      const localLanguageId = matchLocalLanguageId(language);
      if (localLanguageId && !backendLanguageByLocalId.has(localLanguageId)) {
        backendLanguageByLocalId.set(localLanguageId, language);
      }
    });

  return studentCodeExercise.languages.map((language) => {
    const backendLanguage = backendLanguageByLocalId.get(language.id);

    return {
      ...language,
      backendLanguageId: backendLanguage?.id ?? null,
      backendSlug: backendLanguage?.slug ?? null,
      runtime: backendLanguage?.version
        ? `${language.runtime} / ${backendLanguage.version}`
        : language.runtime,
    };
  });
}

function mapProblemToExercise(
  problem: BackendProblemResponse | null,
): StudentCodingExercise {
  if (!problem) {
    return studentCodeExercise;
  }

  const constraints = splitConstraintText(problem.constraints);
  const remoteExamples =
    problem.sampleInput || problem.sampleOutput
      ? [
          {
            title: "Exemple principal",
            input: problem.sampleInput || "N/A",
            output: problem.sampleOutput || "N/A",
            explanation:
              problem.explanation ||
              "Utilisez cet exemple comme reference rapide avant l execution.",
          },
        ]
      : [];

  const detailParts = [
    problem.inputFormat,
    problem.outputFormat,
    problem.explanation,
  ].filter((value): value is string => Boolean(value?.trim()));

  return {
    ...studentCodeExercise,
    title: problem.title,
    difficulty: formatDifficulty(problem.difficulty),
    category: problem.tags[0]?.name || studentCodeExercise.category,
    description: problem.statement,
    detail: detailParts.join(" "),
    timeLimit: `${problem.timeLimitMs}ms`,
    memoryLimit: `${problem.memoryLimitMb}MB`,
    tags:
      problem.tags.length > 0
        ? problem.tags.map((tag) => tag.name)
        : studentCodeExercise.tags,
    constraints:
      constraints.length > 0 ? constraints : studentCodeExercise.constraints,
    examples:
      remoteExamples.length > 0 ? remoteExamples : studentCodeExercise.examples,
  };
}

function mapExecutionRecord(
  response: BackendJudgeRunResponse | BackendSubmissionResponse,
): StudentCodeExecutionRecord {
  return {
    id: response.id,
    verdict: response.verdict,
    status: response.status,
    stdout: response.stdout,
    stderr: response.stderr,
    compileOutput: response.compileOutput,
    timeMs: response.timeMs,
    memoryKb: response.memoryKb,
    exitCode: response.exitCode,
    languageLabel: response.language?.name,
    createdAt: response.createdAt,
    submittedAt: "submittedAt" in response ? response.submittedAt : undefined,
  };
}

function buildExecutionPayload<
  TPayload extends RunCodePayload | SubmitCodePayload,
>(
  payload: TPayload,
  problemId: string | null,
  languages: StudentCodingLanguage[],
) {
  const activeLanguage = languages.find(
    (language) => language.id === payload.languageId,
  );

  return {
    expectedOutput: payload.expectedOutput,
    languageId: activeLanguage?.backendLanguageId || undefined,
    problemId,
    sourceCode: payload.sourceCode,
    stdin: payload.stdin,
  };
}

export async function fetchStudentCodeEditorBootstrap() {
  const [problems, languages] = await Promise.all([
    requestApiJson<BackendProblemResponse[]>(
      "/api/problems/library",
      {
        method: "GET",
      },
      "Unable to load the problem library.",
    ),
    requestAuthenticatedApiJson<BackendSupportedLanguage[]>(
      "/api/problems/languages/all",
      {
        method: "GET",
      },
      "Unable to load the supported languages.",
    ),
  ]);

  const selectedProblem = pickPreferredProblem(problems);

  return {
    exercise: {
      ...mapProblemToExercise(selectedProblem),
      languages: buildExerciseLanguages(languages),
    },
    problemId: selectedProblem?.id ?? null,
  };
}

export async function createJudgeRun(
  payload: RunCodePayload,
  problemId: string | null,
  languages: StudentCodingLanguage[],
) {
  const response = await requestAuthenticatedApiJson<BackendJudgeRunResponse>(
    "/api/judge/runs",
    {
      body: JSON.stringify(
        buildExecutionPayload(payload, problemId, languages),
      ),
      method: "POST",
    },
    "Unable to start a code run right now.",
  );

  return mapExecutionRecord(response);
}

export async function fetchJudgeRun(runId: string) {
  const response = await requestAuthenticatedApiJson<BackendJudgeRunResponse>(
    `/api/judge/runs/${runId}`,
    {
      method: "GET",
    },
    "Unable to refresh this code run right now.",
  );

  return mapExecutionRecord(response);
}

export async function createSubmission(
  payload: SubmitCodePayload,
  problemId: string | null,
  languages: StudentCodingLanguage[],
) {
  const response = await requestAuthenticatedApiJson<BackendSubmissionResponse>(
    "/api/submissions",
    {
      body: JSON.stringify(
        buildExecutionPayload(payload, problemId, languages),
      ),
      method: "POST",
    },
    "Unable to submit your solution right now.",
  );

  return mapExecutionRecord(response);
}

export async function fetchSubmission(submissionId: string) {
  const response = await requestAuthenticatedApiJson<BackendSubmissionResponse>(
    `/api/submissions/${submissionId}`,
    {
      method: "GET",
    },
    "Unable to refresh this submission right now.",
  );

  return mapExecutionRecord(response);
}
