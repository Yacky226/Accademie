import type {
  LeaderboardMember,
  LeaderboardPodiumMember,
  LeaderboardStat,
  StudentCourseRecommendation,
  StudentEnrolledCourse,
  StudentEvent,
  StudentNavItem,
} from "./student-workspace.types";

export const studentNavItems: StudentNavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: "DB" },
  { label: "Notifications", href: "/student/notifications", icon: "NT" },
  { label: "My Courses", href: "/student/courses", icon: "CO" },
  { label: "Leaderboard", href: "/student/leaderboard", icon: "LB" },
  { label: "Code Editor", href: "/student/problems", icon: "CE" },
  { label: "Calendar", href: "/student/calendar", icon: "CA" },
  { label: "Settings", href: "/student/settings", icon: "SE" },
  { label: "Support", href: "/student/support", icon: "SU" },
];

export const dashboardRecommendations: StudentCourseRecommendation[] = [
  {
    title: "Cloud Native Patterns",
    level: "Expert",
    hours: "24 Heures",
    description:
      "Maitrisez les architectures distribuees et la mise a l echelle automatique sur Kubernetes.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDWqX6hzcwolSYlt1iCvyma8yxsI4yxF_JpoDQaRchF10csHHXhkjLidP8kz6-mm4oUFfGW4iVHVGoFjBPyVPyGk4X1J2yetH3LzKLFO5sz6twmhPH_fJUaDIAKZl-fyQziqmEPijdPQ0ULVISN_fKIZJgKWa3LsctIheSVIdKOgOSDrOsGlklADjGunL-Ah7nkdfk_B7c3SUv3vcM4h5PI-Rzd49Ix2tlF13DIfiLQNZRBHog5VO325U4ls0ToqiCltl5XlrspPW_X",
  },
  {
    title: "Database Tuning 101",
    level: "Advanced",
    hours: "18 Heures",
    description:
      "Optimisez vos requetes SQL et gerez des milliards de lignes avec PostgreSQL.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDPvucqwUiZhzEQF_bjyXt4si66i4rifvri1aUk2HlbkoTpOHWG4fDQ7aiXpJrzqIJYvEiJ-jqPH13I7OUmp95hLf6mjOGUTt2QwGpLwuMH5jTiq13F9JrqxiVNflx5fRcGmaa4IE7_QMcY3q64qhd6DWXkTep3rbk1EhLHrXbWwTsN0Qa0xBNlydYFrH1idKgl7Bt8ds8gpbY1gtiuBY0L0-adtYYr4heN0Oby015ukNpFJq2fuklLSipjDcQZgmlkbuT4mPOiFAWI",
  },
];

export const studentEnrolledCourses: StudentEnrolledCourse[] = [];

export const calendarEvents: StudentEvent[] = [
  {
    day: "13",
    month: "Oct",
    title: "Review de Portfolio",
    detail: "10:00 - 11:30",
    badge: "Live",
  },
  {
    day: "17",
    month: "Oct",
    title: "Design Durable v1",
    detail: "Soumission Finale",
    badge: "Urgent",
  },
  {
    day: "22",
    month: "Oct",
    title: "Structures Mobiles",
    detail: "Groupe B - Salle 4",
    badge: "Mentor",
  },
  {
    day: "30",
    month: "Oct",
    title: "Projet Final",
    detail: "Dossier Complet",
    badge: "Cours",
  },
];

export const leaderboardPodium: LeaderboardPodiumMember[] = [
  {
    rank: 2,
    name: "Elena Vance",
    specialty: "Cloud Infrastructure",
    xp: "14,250 XP",
    streakLabel: "2nd",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDpt8VWsNZ3psMNA4qPtoCIgPq06w5lQgFViumLxE57t6nnS6usleLCTBNUODP63h6idX_A6Ud1eRb1ABCBD-QTrpFXXshiWK-7A5yRMP-mVoeEwdHY21SNcF8F38iR9JJajv36mUpHe9VGs-YCsrCobGVVix6B1OGAIxboDJBqVvwNbMSRYWyc8w33iFf4Q4souInxxLZmJ_RUG0ySXiy-EGsITM2mJXRGdo2x8smGy_mxDY2B9zwjmvQhuGEp9cvlgRushTbu3yHJ",
  },
  {
    rank: 1,
    name: "Marcus Thorne",
    specialty: "Systems Synthesis",
    xp: "18,920 XP",
    streakLabel: "Champion",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFTw9s9Ww1HuxE4dytQY5AxSuJMcx91GJIcnKw6ofoCNKgyfznAQnNix9tk-elRQi63pWu8m_agyZKcB9ArNbkIULywGy3Tdmbpv7ucn1psI8iYz58uPIB1rAI8ok7A_787MGmop3ouOYAUhK3ptUoiqHP_2KNdxhhXGfICKn4P8Bq4lpJwMXmlP2Ecie0aow-Hg5JS608TfLBfhsqLIoiXs9a67LNCuKMO57HmDcFLozzoJsMFnphzwGlLOQFAkuHExentIfGVcY6",
  },
  {
    rank: 3,
    name: "Jordan Lee",
    specialty: "UX Engineering",
    xp: "12,800 XP",
    streakLabel: "3rd",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDXtOwmffh4M429UfQB752MjauqfjXyqdFocQIJN_MyLOFyBPMwN2NJDK9sGhXHl9OPkomPz8jmKa5ouwY0YxfYlPvnT--s6bdc-gTLonX-DPWRJwLxBDtM9a2f9BEoIj1uYTjGVeoIBzPmEBi7QrEDO6Ctcc_b_bpzyn1TDwtrK-CXZNdkPzAep3JuYiHhNrBvNym2Scg95utQqq2gz0Gc0bmYii4VjfdoIBwFcZccq8fVPI4NVgLd-rP26G-7kMAqFOLtm7XCnG1q",
  },
];

export const leaderboardMembers: LeaderboardMember[] = [
  {
    rank: 4,
    name: "Sarah Jenkins",
    role: "Senior Architect",
    streak: "28",
    badges: ["VR", "PS"],
    points: "11,240",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBIG4-9IX7BHgDpuAd1Ls-BOo4o-XGIUKeL5l9pe2z7ZiEcyCJX0cNqv-VWM_VLXNIEztBpNw9vSwbMb2n4xMjDmg7vXvCf47e1yQdYWcB0zXsf8LTlczF1tgfdOvWk9SbQt6aCljSB4RuGje63FnL2JLLoVLgbWtAJObABevR9L1A3h8cyCW4hp-zkv2G1Q3QnS0Fhr9UurEfyu-k_3UMujG6u6GuIFrFq8SE6gw3jXqpNP3Vu3ypukShABtXiA5Yey-CCWLsVYjXF",
  },
  {
    rank: 5,
    name: "Alex Rivera",
    role: "Systems Architect",
    streak: "15",
    badges: ["VR", "PR", "MT"],
    points: "9,810",
    isCurrentUser: true,
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1teTOkTKFUCMpL0kJfJkSlzgkvyzXuwmurfLLuSvru8WArYPOO4G0mVC5WgT8wcxneCptAuZBlL0Y5fNBkMoiYnqUzAPLPWKCX1si_KYw7EOGlMEH0pLPjvSFnLj4SKPcW_lv26s1iQUU7ajN9X6K_DNw12Y_6sgO51lRuCdljqlyKitOtdgu7t0-pMToY0Ij31T1KTqv9ECEJ83fdNzOCL-r91thOLrdrGlzS_XrUiG05UI9F8FZ7F4at0a50AeXVJvUAfIEKEse",
  },
  {
    rank: 6,
    name: "Daniel Kalu",
    role: "Security Lead",
    streak: "03",
    badges: ["SC"],
    points: "8,720",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDErWVeQzaox35pRwV5TpimX21_xlPF2DTKN87WSAKGE77JuEYv2sC67s328RIRBCjIWeWU6GfGCHWusA9o_TrcZ0rZMHESkN-s7Brx40YUz21T_925lRSOPaXb4svXD6k1ogEpFYdaVxdiqkSXxknUh7crR1MTqEUpeEEzWcMpj_7OAahaOsKlETRikS26GwLaumlvG-RjLJGd3bU4zJ-mEFIHhBgqxg_tv3YfJTgDiMvh1CtBGtmFfLLPipP5AAYTDnNjywmsS-qY",
  },
  {
    rank: 7,
    name: "Mia Wong",
    role: "Data Specialist",
    streak: "19",
    badges: ["DB"],
    points: "7,450",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCvSQ6lCWwUN4SiMMRPNxoobINZN295dwfjyjmnaxzY4JtunGNaJUhOwReUyBSDDckat6k14P_bVVllOBTfHdPNXG-jFzLLKl5Qy4m3e1E1539N0IpcK_hTWe1aoXBSMkqMpBDU4B69NLTykoU7uT60beXi2HWg8wqAM3KUGuaJb7E8ibswiHaaeCIhJrgjSVnb_MMXuMCdZ40chs6Ax6VcdjARHhAqJSh0OiUVlmSBBzgxn9kzS_eVmdzTMzvk0nhOYTl6M_HULDD4",
  },
];

export const leaderboardStats: LeaderboardStat[] = [
  {
    label: "Daily Percentile",
    value: "Top 4%",
    detail: "+1.2% this week",
  },
  {
    label: "Total Badges",
    value: "12",
    detail: "3 new this month",
  },
];
