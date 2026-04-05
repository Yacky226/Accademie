import type {
  TeacherCourseLesson,
  TeacherCourseMetric,
  TeacherDashboardStatCard,
  TeacherKpi,
  TeacherLearner,
  TeacherNavItem,
  TeacherProgressMetric,
  TeacherQuickInsight,
  TeacherSubmission,
} from "./teacher-space.types";

export const teacherNavItems: TeacherNavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: "DB" },
  { label: "Calendar", href: "/teacher/calendar", icon: "CA" },
  { label: "Evaluations", href: "/teacher/evaluations", icon: "EV" },
  { label: "My Courses", href: "/teacher/programs", icon: "MC" },
  { label: "Students", href: "/teacher/students", icon: "ST" },
  { label: "Settings", href: "/teacher/settings", icon: "SE" },
];

export const teacherKpis: TeacherKpi[] = [
  { label: "Etudiants Actifs", value: "124", trend: "+8% ce mois" },
  { label: "Evaluations a corriger", value: "17", trend: "+3 aujourd hui" },
  { label: "Sessions cette semaine", value: "9", trend: "3 restantes" },
  { label: "Taux de completion", value: "86%", trend: "+2.3 points" },
];

export const teacherLearners: TeacherLearner[] = [
  { name: "Nora Ait-Larbi", program: "Cloud Architecture", progress: 92 },
  { name: "Mehdi Benali", program: "Distributed Systems", progress: 81 },
  { name: "Claire Dubois", program: "System Design", progress: 74 },
  { name: "Rayan El Idrissi", program: "Algorithmics", progress: 67 },
];

export const teacherDashboardStats: TeacherDashboardStatCard[] = [
  {
    label: "Overall Performance",
    value: "78.4%",
    trend: "+4.2%",
    tone: "success",
  },
  {
    label: "Active Learners",
    value: "142",
    trend: "Live today",
    tone: "neutral",
  },
  {
    label: "At-Risk Students",
    value: "05",
    trend: "View alerts",
    tone: "warning",
  },
];

export const teacherQuickInsights: TeacherQuickInsight[] = [
  {
    tone: "primary",
    text: "BIM Modeling assignment has 92% pass rate.",
  },
  {
    tone: "error",
    text: '3 students missed the "Structural Physics" quiz.',
  },
  {
    tone: "secondary",
    text: "New mentor onboarding starts Monday.",
  },
];

export const teacherRecentSubmissions: TeacherSubmission[] = [
  {
    initials: "EA",
    student: "Erik Andersson",
    studentId: "ARCH-992",
    module: "Advanced Parametric Facades",
    assignment: "Grasshopper Scripting",
    status: "Needs Review",
    action: "Grade Now",
  },
  {
    initials: "LH",
    student: "Lara Huang",
    studentId: "ARCH-124",
    module: "Sustainability and Urbanism",
    assignment: "Final Thesis Draft",
    status: "Auto-Validated",
    action: "View Details",
  },
  {
    initials: "MJ",
    student: "Marcus Jensen",
    studentId: "ARCH-771",
    module: "Structural Integrity II",
    assignment: "Load Calculation Project",
    status: "Resubmitted",
    action: "Grade Now",
  },
];

export const teacherCourseMetrics: TeacherCourseMetric[] = [
  {
    label: "Total Lessons",
    value: "24",
    note: "+2 this month",
    tone: "primary",
  },
  {
    label: "Published Content",
    value: "18",
    note: "75% of total course",
    tone: "neutral",
  },
  {
    label: "Avg. Duration",
    value: "12.4m",
    note: "Per lesson avg.",
    tone: "neutral",
  },
  {
    label: "Drafts Pending",
    value: "06",
    note: "Requires review",
    tone: "secondary",
  },
];

export const teacherCourseLessons: TeacherCourseLesson[] = [
  {
    index: "01.1",
    title: "Introduction to Load Distribution",
    module: "Fundamentals of Statics",
    type: "Video",
    duration: "14:20",
    status: "Published",
  },
  {
    index: "01.2",
    title: "Static Equilibrium Assessment",
    module: "Fundamentals of Statics",
    type: "Quiz",
    duration: "--:--",
    status: "Draft",
  },
  {
    index: "02.1",
    title: "Reinforced Concrete Design Principles",
    module: "Material Science in Construction",
    type: "Video",
    duration: "28:15",
    status: "Scheduled",
  },
  {
    index: "02.2",
    title: "Tensile Strength Case Studies",
    module: "Material Science in Construction",
    type: "Read",
    duration: "12m Read",
    status: "Published",
  },
];

export const teacherModuleInsightSeries = [40, 65, 90, 55, 30, 75, 45];

export const teacherCourseProgressMetrics: TeacherProgressMetric[] = [
  {
    label: "Filming Progress",
    valueLabel: "85%",
    progress: 85,
    tone: "primary",
  },
  {
    label: "Resource Files Uploaded",
    valueLabel: "42/60",
    progress: 70,
    tone: "primary",
  },
  {
    label: "Review Cycle",
    valueLabel: "Stage 2",
    progress: 40,
    tone: "secondary",
  },
];
