import { requestApiJson } from "@/core/api/api-http-client";
import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type {
  StudentCodingDifficulty,
  StudentCodingExercise,
  StudentCodingLanguage,
  StudentCodingLanguageId,
  StudentCodingProblemSummary,
} from "../model/student-code-editor.contracts";
import { studentCodeExercise } from "../model/student-code-editor.catalog";
import type {
  BackendJudgeRunResponse,
  BackendProblemResponse,
  BackendSubmissionEvaluationResponse,
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

function formatDifficulty(difficulty: string): StudentCodingDifficulty {
  const normalizedDifficulty = normalizeValue(difficulty);

  if (
    normalizedDifficulty === "easy" ||
    normalizedDifficulty === "facile"
  ) {
    return "Facile";
  }

  if (
    normalizedDifficulty === "medium" ||
    normalizedDifficulty === "moyen" ||
    normalizedDifficulty === "intermediaire"
  ) {
    return "Intermediaire";
  }

  if (
    normalizedDifficulty === "hard" ||
    normalizedDifficulty === "difficile"
  ) {
    return "Difficile";
  }

  return "Intermediaire";
}

function buildProblemExcerpt(statement: string) {
  const compactStatement = statement.replace(/\s+/g, " ").trim();

  if (compactStatement.length <= 180) {
    return compactStatement;
  }

  return `${compactStatement.slice(0, 177).trimEnd()}...`;
}

function filterPublishedProblems(problems: BackendProblemResponse[]) {
  return problems.filter((problem) => problem.isPublished);
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

function mapProblemToSummary(
  problem: BackendProblemResponse,
): StudentCodingProblemSummary {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: formatDifficulty(problem.difficulty),
    category: problem.tags[0]?.name || "Algorithmie",
    excerpt: buildProblemExcerpt(problem.statement),
    tags:
      problem.tags.length > 0
        ? problem.tags.map((tag) => tag.name)
        : studentCodeExercise.tags,
    timeLimit: `${problem.timeLimitMs}ms`,
    memoryLimit: `${problem.memoryLimitMb}MB`,
    testCasesCount: problem.testCasesCount,
    updatedAt: problem.updatedAt,
  };
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

async function fetchProblemLibraryFromApi() {
  const problems = await requestApiJson<BackendProblemResponse[]>(
    "/api/problems/library",
    {
      method: "GET",
    },
    "Unable to load the problem library.",
  );

  return filterPublishedProblems(problems).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

async function fetchPublishedProblemBySlugFromApi(slug: string) {
  return requestApiJson<BackendProblemResponse>(
    `/api/problems/library/${encodeURIComponent(slug)}`,
    {
      method: "GET",
    },
    "Unable to load the selected problem.",
  );
}

async function fetchSupportedLanguagesFromApi() {
  return requestAuthenticatedApiJson<BackendSupportedLanguage[]>(
    "/api/problems/languages/all",
    {
      method: "GET",
    },
    "Unable to load the supported languages.",
  );
}

export async function fetchStudentProblemLibrary() {
  const problems = await fetchProblemLibraryFromApi();
  return problems.map(mapProblemToSummary);
}

function mapExecutionRecord(
  response:
    | BackendJudgeRunResponse
    | BackendSubmissionResponse
    | BackendSubmissionEvaluationResponse,
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
    maxScore: "maxScore" in response ? response.maxScore : undefined,
    passedCount: "passedCount" in response ? response.passedCount : undefined,
    score: "score" in response ? response.score : undefined,
    submittedAt: "submittedAt" in response ? response.submittedAt : undefined,
    testResults:
      "testResults" in response
        ? response.testResults.map((testResult) => ({
            compileOutput: testResult.compileOutput,
            exitCode: testResult.exitCode,
            expectedOutput: testResult.expectedOutput,
            input: testResult.input,
            isHidden: testResult.isHidden,
            memoryKb: testResult.memoryKb,
            passed: testResult.passed,
            points: testResult.points,
            position: testResult.position,
            status: testResult.status,
            stderr: testResult.stderr,
            stdout: testResult.stdout,
            timeMs: testResult.timeMs,
            verdict: testResult.verdict,
          }))
        : undefined,
    totalCount: "totalCount" in response ? response.totalCount : undefined,
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

export async function fetchStudentCodeEditorBootstrap(
  selectedProblemSlug: string | null | undefined = null,
) {
  if (selectedProblemSlug) {
    const [selectedProblem, languages] = await Promise.all([
      fetchPublishedProblemBySlugFromApi(selectedProblemSlug),
      fetchSupportedLanguagesFromApi(),
    ]);

    return {
      exercise: {
        ...mapProblemToExercise(selectedProblem),
        languages: buildExerciseLanguages(languages),
      },
      problemId: selectedProblem.id,
      problemSlug: selectedProblem.slug,
    };
  }

  const [problems, languages] = await Promise.all([
    fetchProblemLibraryFromApi(),
    fetchSupportedLanguagesFromApi(),
  ]);
  const selectedProblem = pickPreferredProblem(problems);

  if (!selectedProblem) {
    throw new Error(
      "No published problems are currently available.",
    );
  }

  return {
    exercise: {
      ...mapProblemToExercise(selectedProblem),
      languages: buildExerciseLanguages(languages),
    },
    problemId: selectedProblem.id,
    problemSlug: selectedProblem.slug,
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

export async function fetchSubmissionEvaluation(submissionId: string) {
  const response =
    await requestAuthenticatedApiJson<BackendSubmissionEvaluationResponse>(
      `/api/submissions/${submissionId}/evaluation`,
      {
        method: "GET",
      },
      "Unable to load the submission evaluation right now.",
    );

  return mapExecutionRecord(response);
}
