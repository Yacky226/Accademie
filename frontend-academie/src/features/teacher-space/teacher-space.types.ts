export interface TeacherNavItem {
  label: string;
  href: string;
  icon: string;
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
