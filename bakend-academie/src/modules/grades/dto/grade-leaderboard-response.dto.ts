export interface GradeLeaderboardStudentResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface GradeGamificationAchievementResponseDto {
  key: string;
  label: string;
  description: string;
  tone: 'xp' | 'streak' | 'solver' | 'grade' | 'rank';
  unlockedAt?: Date;
}

export interface GradeGamificationMetricsResponseDto {
  student: GradeLeaderboardStudentResponseDto;
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
  achievements: GradeGamificationAchievementResponseDto[];
  latestGradedAt?: Date;
  latestSubmissionAt?: Date;
  lastActivityAt?: Date;
}

export interface GradeLeaderboardResponseDto
  extends GradeGamificationMetricsResponseDto {
  rank: number;
}

export interface GradeGamificationSummaryResponseDto
  extends GradeGamificationMetricsResponseDto {
  rank: number | null;
}
