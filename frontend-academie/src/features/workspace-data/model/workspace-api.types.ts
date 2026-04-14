export interface WorkspaceUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

export interface WorkspaceLessonRecord {
  id: string;
  title: string;
  slug: string;
  content: string;
  videoUrl: string | null;
  resourceUrl: string | null;
  durationInMinutes: number | null;
  position: number;
  isFreePreview: boolean;
  isPublished: boolean;
}

export interface WorkspaceCourseModuleRecord {
  id: string;
  title: string;
  description: string;
  position: number;
  isPublished: boolean;
  lessons: WorkspaceLessonRecord[];
}

export interface WorkspaceCourseRecord {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string | null;
  price: string;
  currency: string;
  level: string;
  status: string;
  isPublished: boolean;
  durationInHours: number | null;
  certificateEnabled: boolean;
  creator: WorkspaceUserSummary;
  modules: WorkspaceCourseModuleRecord[];
  enrollmentsCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkspaceEnrollmentRecord {
  id: string;
  status: string;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
  user: WorkspaceUserSummary;
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    thumbnailUrl: string | null;
    creatorName: string;
    durationInHours: number | null;
    nextLessonTitle: string | null;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkspaceEvaluationQuestionRecord {
  id: string;
  statement: string;
  questionType: string;
  options: string[];
  correctAnswer: string | null;
  points: number;
  position: number;
}

export interface WorkspaceEvaluationRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  instructions: string;
  durationInMinutes: number | null;
  maxAttempts: number;
  passScore: number;
  startsAt: string | null;
  endsAt: string | null;
  isPublished: boolean;
  creator: WorkspaceUserSummary;
  course: {
    id: string;
    title: string;
    slug: string;
  } | null;
  questions: WorkspaceEvaluationQuestionRecord[];
  attemptsCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type WorkspaceEvaluationQuestionType =
  | "MULTIPLE_CHOICE"
  | "MULTIPLE_RESPONSE"
  | "FILL_BLANK"
  | "TEXT";

export interface WorkspaceEvaluationAttemptRecord {
  id: string;
  status: string;
  answers: Record<string, unknown> | null;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  student: WorkspaceUserSummary;
  grader: WorkspaceUserSummary | null;
  evaluation: {
    id: string;
    title: string;
    slug: string;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkspaceProgramStepRecord {
  id: string;
  title: string;
  description: string;
  position: number;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
}

export interface WorkspaceProgramRecord {
  id: string;
  title: string;
  description: string;
  goal: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  student: WorkspaceUserSummary;
  teacher: WorkspaceUserSummary;
  steps: WorkspaceProgramStepRecord[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkspaceCalendarAttendeeRecord {
  id: string;
  responseStatus: string;
  note: string | null;
  user: WorkspaceUserSummary;
}

export interface WorkspaceCalendarEventRecord {
  id: string;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  status: string;
  location: string;
  meetingUrl: string | null;
  isAllDay: boolean;
  createdBy: WorkspaceUserSummary;
  course: {
    id: string;
    title: string;
    slug: string;
  } | null;
  attendees: WorkspaceCalendarAttendeeRecord[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkspaceGradeRecord {
  id: string;
  title: string;
  type: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number | null;
  feedback: string | null;
  status: string;
  gradedAt: string | null;
  student: WorkspaceUserSummary;
  gradedBy: WorkspaceUserSummary | null;
  course: {
    id: string;
    title: string;
    slug: string;
  } | null;
  evaluationAttemptId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkspaceGamificationStudentRecord extends WorkspaceUserSummary {
  avatarUrl: string | null;
}

export interface WorkspaceGamificationAchievementRecord {
  key: string;
  label: string;
  description: string;
  tone: "xp" | "streak" | "solver" | "grade" | "rank";
  unlockedAt: string | null;
}

export interface WorkspaceGamificationProfileRecord {
  student: WorkspaceGamificationStudentRecord;
  publishedGradesCount: number;
  coursesCount: number;
  averagePercentage: number;
  totalScore: number;
  totalMaxScore: number;
  totalSubmissionsCount: number;
  acceptedSubmissionsCount: number;
  solvedProblemsCount: number;
  acceptanceRate: number;
  activityStreakDays: number;
  totalXp: number;
  level: number;
  levelLabel: string;
  currentLevelXpFloor: number;
  nextLevelXpTarget: number;
  progressToNextLevel: number;
  badges: string[];
  achievements: WorkspaceGamificationAchievementRecord[];
  latestGradedAt: string | null;
  latestSubmissionAt: string | null;
  lastActivityAt: string | null;
}

export interface WorkspaceLeaderboardRecord {
  rank: number;
  student: WorkspaceGamificationStudentRecord;
  publishedGradesCount: number;
  coursesCount: number;
  averagePercentage: number;
  totalScore: number;
  totalMaxScore: number;
  totalSubmissionsCount: number;
  acceptedSubmissionsCount: number;
  solvedProblemsCount: number;
  acceptanceRate: number;
  activityStreakDays: number;
  totalXp: number;
  level: number;
  levelLabel: string;
  currentLevelXpFloor: number;
  nextLevelXpTarget: number;
  progressToNextLevel: number;
  badges: string[];
  achievements: WorkspaceGamificationAchievementRecord[];
  latestGradedAt: string | null;
  latestSubmissionAt: string | null;
  lastActivityAt: string | null;
}

export interface WorkspaceGamificationSummaryRecord
  extends WorkspaceGamificationProfileRecord {
  rank: number | null;
}

export interface CreateWorkspaceCoursePayload {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  currency: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isPublished: boolean;
  durationInHours: number;
  certificateEnabled: boolean;
}

export interface CreateWorkspaceModulePayload {
  title: string;
  description: string;
  position: number;
  isPublished: boolean;
}

export interface CreateWorkspaceLessonPayload {
  title: string;
  slug: string;
  content: string;
  videoUrl: string;
  resourceUrl: string;
  durationInMinutes: number;
  position: number;
  isFreePreview: boolean;
  isPublished: boolean;
}

export interface CreateWorkspaceEvaluationPayload {
  title: string;
  slug: string;
  description: string;
  type: "QUIZ" | "EXAM" | "ASSIGNMENT" | "PRACTICE";
  instructions: string;
  durationInMinutes: number;
  maxAttempts: number;
  passScore: number;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
  courseId: string;
  questions?: CreateWorkspaceEvaluationQuestionPayload[];
}

export interface CreateWorkspaceEvaluationQuestionPayload {
  statement: string;
  questionType: WorkspaceEvaluationQuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
  position: number;
}

export interface GradeWorkspaceEvaluationAttemptPayload {
  score: number;
  feedback: string;
}

export interface SubmitWorkspaceEvaluationPayload {
  answers: Record<string, unknown>;
}

export interface CreateWorkspaceProgramPayload {
  title: string;
  description: string;
  goal: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  startDate: string;
  endDate: string;
  studentId: string;
}

export interface CreateWorkspaceProgramStepPayload {
  title: string;
  description: string;
  position: number;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  dueDate: string;
}

export interface UpdateWorkspaceProgramStepProgressPayload {
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
}

export interface CreateWorkspaceCalendarEventPayload {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: string;
  location: string;
  meetingUrl: string;
  isAllDay: boolean;
  courseId: string;
}
