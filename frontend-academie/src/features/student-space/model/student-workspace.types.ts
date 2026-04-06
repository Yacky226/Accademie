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
