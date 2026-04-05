export interface StudentNavItem {
  label: string;
  href: string;
  icon: string;
}

export interface StudentCourseRecommendation {
  title: string;
  level: string;
  hours: string;
  description: string;
  imageUrl: string;
}

export interface StudentEnrolledCourse {
  title: string;
  mentor: string;
  progress: number;
  nextLesson: string;
}

export interface StudentEvent {
  day: string;
  month: string;
  title: string;
  detail: string;
  badge: string;
}

export interface LeaderboardPodiumMember {
  rank: 1 | 2 | 3;
  name: string;
  specialty: string;
  xp: string;
  avatarUrl: string;
  streakLabel?: string;
}

export interface LeaderboardMember {
  rank: number;
  name: string;
  role: string;
  streak: string;
  badges: string[];
  points: string;
  avatarUrl: string;
  isCurrentUser?: boolean;
}

export interface LeaderboardStat {
  label: string;
  value: string;
  detail: string;
}

export type StudentCodingLanguageId = "python" | "typescript" | "java" | "cpp";

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

export interface StudentConsoleEntry {
  tone: "muted" | "success" | "info" | "warning";
  message: string;
}
