import type { WorkspaceNavIconName } from "@/features/workspace-shell/model/workspace-nav.types";

export interface TeacherNavItem {
  label: string;
  href: string;
  icon: WorkspaceNavIconName;
}

export interface TeacherKpi {
  label: string;
  value: string;
  trend: string;
}

export interface TeacherLearner {
  name: string;
  program: string;
  progress: number;
}

export interface TeacherDashboardStatCard {
  label: string;
  value: string;
  trend: string;
  tone?: "neutral" | "success" | "warning";
}

export interface TeacherSubmission {
  initials: string;
  student: string;
  studentId: string;
  module: string;
  assignment: string;
  status: "Needs Review" | "Auto-Validated" | "Resubmitted";
  action: "Grade Now" | "View Details";
}

export interface TeacherQuickInsight {
  tone: "primary" | "error" | "secondary";
  text: string;
}

export interface TeacherCourseMetric {
  label: string;
  value: string;
  note: string;
  tone?: "primary" | "neutral" | "secondary";
}

export interface TeacherCourseLesson {
  index: string;
  title: string;
  module: string;
  type: "Video" | "Quiz" | "Read";
  duration: string;
  status: "Published" | "Draft" | "Scheduled";
}

export interface TeacherProgressMetric {
  label: string;
  valueLabel: string;
  progress: number;
  tone?: "primary" | "secondary";
}

export interface TeacherProblemTagRecord {
  id: string;
  name: string;
  slug: string;
}

export interface TeacherProblemTestCaseRecord {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherProblemRecord {
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
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublished: boolean;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tags: TeacherProblemTagRecord[];
  testCasesCount: number;
  testCases: TeacherProblemTestCaseRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSupportedLanguageRecord {
  id: string;
  name: string;
  slug: string;
  version?: string;
  judge0LanguageId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherProblemPayload {
  title: string;
  slug: string;
  statement: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  sampleInput?: string;
  sampleOutput?: string;
  explanation?: string;
  difficulty: TeacherProblemRecord["difficulty"];
  status: TeacherProblemRecord["status"];
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublished: boolean;
}

export type UpdateTeacherProblemPayload = Partial<CreateTeacherProblemPayload>;

export interface CreateTeacherProblemTagPayload {
  name: string;
  slug: string;
}

export interface CreateTeacherProblemTestCasePayload {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  points?: number;
  position: number;
}
