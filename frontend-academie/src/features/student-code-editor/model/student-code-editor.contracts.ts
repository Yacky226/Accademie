export type StudentCodingLanguageId = "python" | "typescript" | "java" | "cpp";
export type StudentCodingDifficulty = "Facile" | "Intermediaire" | "Difficile";
export type StudentCodingDifficultyFilter = "all" | StudentCodingDifficulty;

export interface StudentCodingLanguage {
  id: StudentCodingLanguageId;
  label: string;
  runtime: string;
  fileName: string;
  starterCode: string;
  runSummary: string;
  submitSummary: string;
  backendLanguageId?: string | null;
  backendSlug?: string | null;
}

export interface StudentCodingExample {
  title: string;
  input: string;
  output: string;
  explanation: string;
}

export interface StudentCodingTestCase {
  label: string;
  status: "passed" | "pending" | "warning";
  detail: string;
}

export interface StudentCodingExercise {
  title: string;
  difficulty: string;
  category: string;
  description: string;
  detail: string;
  diagramUrl: string;
  diagramAlt: string;
  diagramCaption: string;
  likes: string;
  dislikes: string;
  lastAttempt: string;
  timeLimit: string;
  memoryLimit: string;
  acceptanceRate: string;
  submissions: string;
  tags: string[];
  examples: StudentCodingExample[];
  constraints: string[];
  hints: string[];
  tests: StudentCodingTestCase[];
  languages: StudentCodingLanguage[];
}

export interface StudentCodingProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: StudentCodingDifficulty;
  category: string;
  excerpt: string;
  tags: string[];
  timeLimit: string;
  memoryLimit: string;
  testCasesCount: number;
  updatedAt: string;
}

export interface StudentConsoleEntry {
  tone: "muted" | "success" | "info" | "warning";
  message: string;
}
