import type {
  StudentCodingExercise,
  StudentCodingLanguageId,
} from "./student-code-editor.contracts";

export interface BackendProblemResponse {
  id: string;
  title: string;
  slug: string;
  statement: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  sampleInput?: string;
  sampleOutput?: string;
  explanation?: string;
  difficulty: string;
  status: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublished: boolean;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  testCasesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSupportedLanguage {
  id: string;
  name: string;
  slug: string;
  version?: string;
  judge0LanguageId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendJudgeRunResponse {
  id: string;
  token: string;
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  status: string;
  verdict?: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
  createdAt: string;
  updatedAt: string;
  language?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface BackendSubmissionResponse {
  id: string;
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  status: string;
  verdict?: string;
  score?: string;
  maxScore: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
  submittedAt: string;
  evaluatedAt?: string;
  judgeRunId?: string;
  createdAt: string;
  updatedAt: string;
  language?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface BackendSubmissionEvaluationTestResult {
  position: number;
  points: number;
  isHidden: boolean;
  passed: boolean;
  status: string;
  verdict: string;
  input?: string;
  expectedOutput?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
}

export interface BackendSubmissionEvaluationResponse
  extends BackendSubmissionResponse {
  passedCount: number;
  totalCount: number;
  testResults: BackendSubmissionEvaluationTestResult[];
}

export interface StudentCodeSubmissionTestResult {
  position: number;
  points: number;
  isHidden: boolean;
  passed: boolean;
  status: string;
  verdict: string;
  input?: string;
  expectedOutput?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
}

export interface StudentCodeExecutionRecord {
  id: string;
  verdict?: string;
  status: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
  languageLabel?: string;
  createdAt: string;
  submittedAt?: string;
  score?: string;
  maxScore?: string;
  passedCount?: number;
  totalCount?: number;
  testResults?: StudentCodeSubmissionTestResult[];
}

export interface StudentCodeEditorState {
  errorMessage: string | null;
  exercise: StudentCodingExercise;
  latestRun: StudentCodeExecutionRecord | null;
  latestSubmission: StudentCodeExecutionRecord | null;
  problemId: string | null;
  problemSlug: string | null;
  runStatus: "idle" | "loading" | "succeeded" | "failed";
  status: "idle" | "loading" | "succeeded" | "failed";
  submitStatus: "idle" | "loading" | "succeeded" | "failed";
}

export interface RunCodePayload {
  expectedOutput?: string;
  languageId: StudentCodingLanguageId;
  sourceCode: string;
  stdin?: string;
}

export type SubmitCodePayload = RunCodePayload;
