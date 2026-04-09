import { resolveApiAssetUrl } from "@/core/config/application-environment";
import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type {
  CreateWorkspaceCalendarEventPayload,
  CreateWorkspaceCoursePayload,
  CreateWorkspaceEvaluationPayload,
  CreateWorkspaceEvaluationQuestionPayload,
  CreateWorkspaceLessonPayload,
  CreateWorkspaceModulePayload,
  CreateWorkspaceProgramPayload,
  CreateWorkspaceProgramStepPayload,
  GradeWorkspaceEvaluationAttemptPayload,
  SubmitWorkspaceEvaluationPayload,
  WorkspaceCalendarEventRecord,
  WorkspaceCourseRecord,
  WorkspaceEnrollmentRecord,
  WorkspaceEvaluationAttemptRecord,
  WorkspaceEvaluationRecord,
  WorkspaceGamificationSummaryRecord,
  WorkspaceGamificationAchievementRecord,
  WorkspaceGradeRecord,
  WorkspaceLeaderboardRecord,
  WorkspaceProgramRecord,
  WorkspaceUserSummary,
} from "../model/workspace-api.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractData(payload: unknown) {
  if (!isRecord(payload)) {
    return {};
  }

  if (isRecord(payload.data)) {
    return payload.data;
  }

  return payload;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown) {
  const normalizedValue = readString(value).trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number.parseFloat(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
}

function readNullableNumber(value: unknown) {
  const parsedValue = readNumber(value);
  return parsedValue === 0 && value !== 0 && value !== "0" ? null : parsedValue;
}

function mapUser(value: unknown): WorkspaceUserSummary {
  const data = extractData(value);
  const firstName = readString(data.firstName);
  const lastName = readString(data.lastName);

  return {
    id: readString(data.id),
    firstName,
    lastName,
    email: readString(data.email),
    fullName: `${firstName} ${lastName}`.trim(),
  };
}

function mapCourse(value: unknown): WorkspaceCourseRecord {
  const data = extractData(value);

  return {
    id: readString(data.id),
    title: readString(data.title),
    slug: readString(data.slug),
    shortDescription: readString(data.shortDescription),
    description: readString(data.description),
    thumbnailUrl: resolveApiAssetUrl(readNullableString(data.thumbnailUrl)),
    price: readString(data.price),
    currency: readString(data.currency),
    level: readString(data.level),
    status: readString(data.status),
    isPublished: Boolean(data.isPublished),
    durationInHours: readNullableNumber(data.durationInHours),
    certificateEnabled: Boolean(data.certificateEnabled),
    creator: mapUser(data.creator),
    modules: Array.isArray(data.modules)
      ? data.modules.map((moduleValue) => {
          const moduleData = extractData(moduleValue);

          return {
            id: readString(moduleData.id),
            title: readString(moduleData.title),
            description: readString(moduleData.description),
            position: readNumber(moduleData.position),
            isPublished: Boolean(moduleData.isPublished),
            lessons: Array.isArray(moduleData.lessons)
              ? moduleData.lessons.map((lessonValue) => {
                  const lessonData = extractData(lessonValue);

                  return {
                    id: readString(lessonData.id),
                    title: readString(lessonData.title),
                    slug: readString(lessonData.slug),
                    content: readString(lessonData.content),
                    videoUrl: readNullableString(lessonData.videoUrl),
                    resourceUrl: readNullableString(lessonData.resourceUrl),
                    durationInMinutes: readNullableNumber(lessonData.durationInMinutes),
                    position: readNumber(lessonData.position),
                    isFreePreview: Boolean(lessonData.isFreePreview),
                    isPublished: Boolean(lessonData.isPublished),
                  };
                })
              : [],
          };
        })
      : [],
    enrollmentsCount: readNumber(data.enrollmentsCount),
    createdAt: readNullableString(data.createdAt),
    updatedAt: readNullableString(data.updatedAt),
  };
}

function mapEnrollment(value: unknown): WorkspaceEnrollmentRecord {
  const data = extractData(value);
  const course = extractData(data.course);

  return {
    id: readString(data.id),
    status: readString(data.status),
    progressPercent: readNumber(data.progressPercent),
    startedAt: readNullableString(data.startedAt),
    completedAt: readNullableString(data.completedAt),
    user: mapUser(data.user),
    course: {
      id: readString(course.id),
      title: readString(course.title),
      slug: readString(course.slug),
      shortDescription: readString(course.shortDescription),
      thumbnailUrl: resolveApiAssetUrl(readNullableString(course.thumbnailUrl)),
      creatorName: readString(course.creatorName),
      durationInHours: readNullableNumber(course.durationInHours),
      nextLessonTitle: readNullableString(course.nextLessonTitle),
    },
    createdAt: readNullableString(data.createdAt),
    updatedAt: readNullableString(data.updatedAt),
  };
}

function mapEvaluation(value: unknown): WorkspaceEvaluationRecord {
  const data = extractData(value);
  const course = isRecord(data.course) ? extractData(data.course) : null;

  return {
    id: readString(data.id),
    title: readString(data.title),
    slug: readString(data.slug),
    description: readString(data.description),
    type: readString(data.type),
    instructions: readString(data.instructions),
    durationInMinutes: readNullableNumber(data.durationInMinutes),
    maxAttempts: readNumber(data.maxAttempts),
    passScore: readNumber(data.passScore),
    startsAt: readNullableString(data.startsAt),
    endsAt: readNullableString(data.endsAt),
    isPublished: Boolean(data.isPublished),
    creator: mapUser(data.creator),
    course: course
      ? {
          id: readString(course.id),
          title: readString(course.title),
          slug: readString(course.slug),
        }
      : null,
    questions: Array.isArray(data.questions)
      ? data.questions.map((questionValue) => {
          const questionData = extractData(questionValue);

          return {
            id: readString(questionData.id),
            statement: readString(questionData.statement),
            questionType: readString(questionData.questionType),
            options: Array.isArray(questionData.options)
              ? questionData.options.filter(
                  (option): option is string => typeof option === "string",
                )
              : [],
            correctAnswer: readNullableString(questionData.correctAnswer),
            points: readNumber(questionData.points),
            position: readNumber(questionData.position),
          };
        })
      : [],
    attemptsCount: readNumber(data.attemptsCount),
    createdAt: readNullableString(data.createdAt),
    updatedAt: readNullableString(data.updatedAt),
  };
}

function mapEvaluationAttempt(value: unknown): WorkspaceEvaluationAttemptRecord {
  const data = extractData(value);
  const grader = isRecord(data.grader) ? data.grader : null;
  const evaluation = extractData(data.evaluation);

  return {
    id: readString(data.id),
    status: readString(data.status),
    score: readNullableNumber(data.score),
    maxScore: readNumber(data.maxScore),
    feedback: readNullableString(data.feedback),
    startedAt: readNullableString(data.startedAt),
    submittedAt: readNullableString(data.submittedAt),
    student: mapUser(data.student),
    grader: grader ? mapUser(grader) : null,
    evaluation: {
      id: readString(evaluation.id),
      title: readString(evaluation.title),
      slug: readString(evaluation.slug),
    },
    createdAt: readNullableString(data.createdAt),
    updatedAt: readNullableString(data.updatedAt),
  };
}

function mapProgram(value: unknown): WorkspaceProgramRecord {
  const data = extractData(value);

  return {
    id: readString(data.id),
    title: readString(data.title),
    description: readString(data.description),
    goal: readString(data.goal),
    status: readString(data.status),
    startDate: readNullableString(data.startDate),
    endDate: readNullableString(data.endDate),
    student: mapUser(data.student),
    teacher: mapUser(data.teacher),
    steps: Array.isArray(data.steps)
      ? data.steps.map((stepValue) => {
          const stepData = extractData(stepValue);

          return {
            id: readString(stepData.id),
            title: readString(stepData.title),
            description: readString(stepData.description),
            position: readNumber(stepData.position),
            status: readString(stepData.status),
            dueDate: readNullableString(stepData.dueDate),
            completedAt: readNullableString(stepData.completedAt),
          };
        })
      : [],
    createdAt: readNullableString(data.createdAt),
    updatedAt: readNullableString(data.updatedAt),
  };
}

function mapCalendarEvent(value: unknown): WorkspaceCalendarEventRecord {
  const data = extractData(value);
  const course = isRecord(data.course) ? extractData(data.course) : null;

  return {
    id: readString(data.id),
    title: readString(data.title),
    description: readString(data.description),
    startsAt: readNullableString(data.startsAt),
    endsAt: readNullableString(data.endsAt),
    timezone: readString(data.timezone),
    status: readString(data.status),
    location: readString(data.location),
    meetingUrl: readNullableString(data.meetingUrl),
    isAllDay: Boolean(data.isAllDay),
    createdBy: mapUser(data.createdBy),
    course: course
      ? {
          id: readString(course.id),
          title: readString(course.title),
          slug: readString(course.slug),
        }
      : null,
    attendees: Array.isArray(data.attendees)
      ? data.attendees.map((attendeeValue) => {
          const attendeeData = extractData(attendeeValue);
          return {
            id: readString(attendeeData.id),
            responseStatus: readString(attendeeData.responseStatus),
            note: readNullableString(attendeeData.note),
            user: mapUser(attendeeData.user),
          };
        })
      : [],
    createdAt: readNullableString(data.createdAt),
    updatedAt: readNullableString(data.updatedAt),
  };
}

function mapGrade(value: unknown): WorkspaceGradeRecord {
  const data = extractData(value);
  const course = isRecord(data.course) ? extractData(data.course) : null;
  const grader = isRecord(data.gradedBy) ? data.gradedBy : null;

  return {
    id: readString(data.id),
    title: readString(data.title),
    type: readString(data.type),
    score: readNumber(data.score),
    maxScore: readNumber(data.maxScore),
    percentage: readNumber(data.percentage),
    weight: readNullableNumber(data.weight),
    feedback: readNullableString(data.feedback),
    status: readString(data.status),
    gradedAt: readNullableString(data.gradedAt),
    student: mapUser(data.student),
    gradedBy: grader ? mapUser(grader) : null,
    course: course
      ? {
          id: readString(course.id),
          title: readString(course.title),
          slug: readString(course.slug),
        }
      : null,
    evaluationAttemptId: readNullableString(data.evaluationAttemptId),
    createdAt: readNullableString(data.createdAt),
    updatedAt: readNullableString(data.updatedAt),
  };
}

function mapAchievement(value: unknown): WorkspaceGamificationAchievementRecord {
  const data = extractData(value);
  const tone = readString(data.tone);

  return {
    key: readString(data.key),
    label: readString(data.label),
    description: readString(data.description),
    tone:
      tone === "streak" || tone === "solver" || tone === "grade" || tone === "rank"
        ? tone
        : "xp",
    unlockedAt: readNullableString(data.unlockedAt),
  };
}

function mapLeaderboardEntry(value: unknown): WorkspaceLeaderboardRecord {
  const data = extractData(value);
  const studentData = extractData(data.student);
  const firstName = readString(studentData.firstName);
  const lastName = readString(studentData.lastName);

  return {
    rank: readNumber(data.rank),
    student: {
      id: readString(studentData.id),
      firstName,
      lastName,
      email: readString(studentData.email),
      fullName: `${firstName} ${lastName}`.trim(),
      avatarUrl: resolveApiAssetUrl(readNullableString(studentData.avatarUrl)),
    },
    publishedGradesCount: readNumber(data.publishedGradesCount),
    coursesCount: readNumber(data.coursesCount),
    averagePercentage: readNumber(data.averagePercentage),
    totalScore: readNumber(data.totalScore),
    totalMaxScore: readNumber(data.totalMaxScore),
    totalSubmissionsCount: readNumber(data.totalSubmissionsCount),
    acceptedSubmissionsCount: readNumber(data.acceptedSubmissionsCount),
    solvedProblemsCount: readNumber(data.solvedProblemsCount),
    acceptanceRate: readNumber(data.acceptanceRate),
    activityStreakDays: readNumber(data.activityStreakDays),
    totalXp: readNumber(data.totalXp),
    level: readNumber(data.level),
    levelLabel: readString(data.levelLabel),
    currentLevelXpFloor: readNumber(data.currentLevelXpFloor),
    nextLevelXpTarget: readNumber(data.nextLevelXpTarget),
    progressToNextLevel: readNumber(data.progressToNextLevel),
    badges: Array.isArray(data.badges)
      ? data.badges.filter((badge): badge is string => typeof badge === "string")
      : [],
    achievements: Array.isArray(data.achievements)
      ? data.achievements.map(mapAchievement)
      : [],
    latestGradedAt: readNullableString(data.latestGradedAt),
    latestSubmissionAt: readNullableString(data.latestSubmissionAt),
    lastActivityAt: readNullableString(data.lastActivityAt),
  };
}

function mapGamificationSummary(value: unknown): WorkspaceGamificationSummaryRecord {
  const data = extractData(value);
  const leaderboardEntry = mapLeaderboardEntry(data);

  return {
    ...leaderboardEntry,
    rank: readNullableNumber(data.rank),
  };
}

async function getList<T>(path: string, fallbackMessage: string, mapper: (value: unknown) => T) {
  const response = await requestAuthenticatedApiJson<unknown[]>(
    path,
    { method: "GET" },
    fallbackMessage,
  );

  return Array.isArray(response) ? response.map(mapper) : [];
}

export function fetchWorkspaceCourses() {
  return getList("/api/courses", "Impossible de charger les cours.", mapCourse);
}

export async function createWorkspaceCourse(payload: CreateWorkspaceCoursePayload) {
  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/courses",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Impossible de creer le cours.",
  );

  return mapCourse(response);
}

export async function createWorkspaceCourseModule(
  courseId: string,
  payload: CreateWorkspaceModulePayload,
) {
  await requestAuthenticatedApiJson<unknown>(
    `/api/courses/${courseId}/modules`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Impossible d ajouter ce module.",
  );
}

export async function createWorkspaceCourseLesson(
  courseId: string,
  moduleId: string,
  payload: CreateWorkspaceLessonPayload,
) {
  await requestAuthenticatedApiJson<unknown>(
    `/api/courses/${courseId}/modules/${moduleId}/lessons`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Impossible d ajouter cette lecon.",
  );
}

export function fetchWorkspaceCourseEnrollments(courseId: string) {
  return getList(
    `/api/courses/${courseId}/enrollments`,
    "Impossible de charger les inscriptions.",
    mapEnrollment,
  );
}

export function fetchWorkspaceMyEnrollments() {
  return getList(
    "/api/courses/enrollments/me",
    "Impossible de charger vos inscriptions.",
    mapEnrollment,
  );
}

export function fetchWorkspaceEvaluations() {
  return getList(
    "/api/evaluations",
    "Impossible de charger les evaluations.",
    mapEvaluation,
  );
}

export async function createWorkspaceEvaluation(
  payload: CreateWorkspaceEvaluationPayload,
) {
  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/evaluations",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Impossible de creer l evaluation.",
  );

  return mapEvaluation(response);
}

export async function createWorkspaceEvaluationQuestion(
  evaluationId: string,
  payload: CreateWorkspaceEvaluationQuestionPayload,
) {
  await requestAuthenticatedApiJson<unknown>(
    `/api/evaluations/${evaluationId}/questions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Impossible d ajouter cette question.",
  );
}

export function fetchWorkspaceEvaluationAttempts(evaluationId: string) {
  return getList(
    `/api/evaluations/${evaluationId}/attempts`,
    "Impossible de charger les tentatives.",
    mapEvaluationAttempt,
  );
}

export function fetchWorkspaceMyEvaluationAttempts() {
  return getList(
    "/api/evaluations/attempts/me",
    "Impossible de charger vos tentatives.",
    mapEvaluationAttempt,
  );
}

export async function submitWorkspaceEvaluationAttempt(
  evaluationId: string,
  payload: SubmitWorkspaceEvaluationPayload,
) {
  const response = await requestAuthenticatedApiJson<unknown>(
    `/api/evaluations/${evaluationId}/attempts`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Impossible de soumettre cette evaluation.",
  );

  return mapEvaluationAttempt(response);
}

export async function gradeWorkspaceEvaluationAttempt(
  attemptId: string,
  payload: GradeWorkspaceEvaluationAttemptPayload,
) {
  const response = await requestAuthenticatedApiJson<unknown>(
    `/api/evaluations/attempts/${attemptId}/grade`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "Impossible de corriger cette tentative.",
  );

  return mapEvaluationAttempt(response);
}

export function fetchWorkspacePrograms() {
  return getList(
    "/api/programs",
    "Impossible de charger les programmes.",
    mapProgram,
  );
}

export async function createWorkspaceProgram(payload: CreateWorkspaceProgramPayload) {
  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/programs",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Impossible de creer ce programme.",
  );

  return mapProgram(response);
}

export async function createWorkspaceProgramStep(
  programId: string,
  payload: CreateWorkspaceProgramStepPayload,
) {
  await requestAuthenticatedApiJson<unknown>(
    `/api/programs/${programId}/steps`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Impossible d ajouter cette etape.",
  );
}

export function fetchWorkspaceMyCalendarEvents() {
  return getList(
    "/api/calendar/events/me",
    "Impossible de charger votre planning.",
    mapCalendarEvent,
  );
}

export async function createWorkspaceCalendarEvent(
  payload: CreateWorkspaceCalendarEventPayload,
) {
  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/calendar/events",
    {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        courseId: payload.courseId || undefined,
      }),
    },
    "Impossible de creer cet evenement.",
  );

  return mapCalendarEvent(response);
}

export function fetchWorkspaceMyGrades() {
  return getList("/api/grades/me", "Impossible de charger vos notes.", mapGrade);
}

export function fetchWorkspaceStudentGrades(studentId: string) {
  return getList(
    `/api/grades/student/${studentId}`,
    "Impossible de charger les notes de cet etudiant.",
    mapGrade,
  );
}

export function fetchWorkspaceLeaderboard() {
  return getList(
    "/api/grades/leaderboard",
    "Impossible de charger le classement.",
    mapLeaderboardEntry,
  );
}

export async function fetchWorkspaceMyGamification() {
  const response = await requestAuthenticatedApiJson<unknown>(
    "/api/grades/gamification/me",
    { method: "GET" },
    "Impossible de charger votre progression gamifiee.",
  );

  return mapGamificationSummary(response);
}
