import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGradeDto } from './dto/create-grade.dto';
import {
  GradeGamificationAchievementResponseDto,
  GradeGamificationMetricsResponseDto,
  GradeGamificationSummaryResponseDto,
  GradeLeaderboardResponseDto,
} from './dto/grade-leaderboard-response.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeEntity } from './entities/grade.entity';
import { GradesRepository } from './repositories/grades.repository';
import { SubmissionsRepository } from '../submissions/repositories/submissions.repository';

type LeaderboardAggregate = {
  student: GradeGamificationMetricsResponseDto['student'];
  publishedGradesCount: number;
  courses: Set<string>;
  totalPercentage: number;
  totalScore: number;
  totalMaxScore: number;
  totalSubmissionsCount: number;
  acceptedSubmissionsCount: number;
  solvedProblems: Set<string>;
  activityDays: Set<string>;
  latestGradedAt?: Date;
  latestSubmissionAt?: Date;
};

type ResolvedGamificationMetrics = Omit<
  GradeLeaderboardResponseDto,
  'rank' | 'badges' | 'achievements'
>;

const LEVEL_STEPS = [
  { floor: 0, label: 'Novice' },
  { floor: 120, label: 'Explorateur' },
  { floor: 260, label: 'Solver' },
  { floor: 460, label: 'Builder' },
  { floor: 760, label: 'Strategist' },
  { floor: 1120, label: 'Champion' },
] as const;

@Injectable()
export class GradesService {
  constructor(
    private readonly gradesRepository: GradesRepository,
    private readonly submissionsRepository: SubmissionsRepository,
  ) {}

  async listGrades(): Promise<GradeEntity[]> {
    return this.gradesRepository.findAllGrades();
  }

  async listMyGrades(studentId: string): Promise<GradeEntity[]> {
    const student = await this.gradesRepository.findUserById(studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    return this.gradesRepository.findGradesByStudentId(studentId);
  }

  async listGradesByStudent(studentId: string): Promise<GradeEntity[]> {
    const student = await this.gradesRepository.findUserById(studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    return this.gradesRepository.findGradesByStudentId(studentId);
  }

  async listLeaderboard(): Promise<GradeLeaderboardResponseDto[]> {
    return this.buildLeaderboardEntries();
  }

  async getMyGamification(
    studentId: string,
  ): Promise<GradeGamificationSummaryResponseDto> {
    const student = await this.gradesRepository.findUserById(studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    const leaderboard = await this.buildLeaderboardEntries();
    const rankedEntry = leaderboard.find((entry) => entry.student.id === studentId);
    if (rankedEntry) {
      return rankedEntry;
    }

    return {
      rank: null,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        avatarUrl: student.avatarUrl ?? undefined,
      },
      publishedGradesCount: 0,
      coursesCount: 0,
      averagePercentage: 0,
      totalScore: 0,
      totalMaxScore: 0,
      totalSubmissionsCount: 0,
      acceptedSubmissionsCount: 0,
      solvedProblemsCount: 0,
      acceptanceRate: 0,
      activityStreakDays: 0,
      totalXp: 0,
      level: 1,
      levelLabel: 'Novice',
      currentLevelXpFloor: 0,
      nextLevelXpTarget: LEVEL_STEPS[1]?.floor ?? 120,
      progressToNextLevel: 0,
      badges: [],
      achievements: [],
      latestGradedAt: undefined,
      latestSubmissionAt: undefined,
      lastActivityAt: undefined,
    };
  }

  async getGradeById(gradeId: string): Promise<GradeEntity> {
    const grade = await this.gradesRepository.findGradeById(gradeId);
    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return grade;
  }

  async createGrade(
    dto: CreateGradeDto,
    graderId?: string,
  ): Promise<GradeEntity> {
    this.assertValidScore(dto.score, dto.maxScore);

    const student = await this.gradesRepository.findUserById(dto.studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    const resolvedGraderId = graderId ?? dto.gradedById;
    const gradedBy = resolvedGraderId
      ? ((await this.gradesRepository.findUserById(resolvedGraderId)) ??
        undefined)
      : undefined;
    if (resolvedGraderId && !gradedBy) {
      throw new NotFoundException('Grader user not found');
    }

    const grade = new GradeEntity();
    grade.title = dto.title;
    grade.type = (dto.type ?? 'MANUAL').toUpperCase();
    grade.score = dto.score.toFixed(2);
    grade.maxScore = dto.maxScore.toFixed(2);
    grade.percentage = this.computePercentage(dto.score, dto.maxScore).toFixed(
      2,
    );
    grade.weight = dto.weight !== undefined ? dto.weight.toFixed(2) : undefined;
    grade.feedback = dto.feedback;
    grade.status = (dto.status ?? 'DRAFT').toUpperCase();
    grade.gradedAt = dto.gradedAt ? new Date(dto.gradedAt) : new Date();
    grade.student = student;
    grade.gradedBy = gradedBy;

    if (dto.courseId) {
      const course = await this.gradesRepository.findCourseById(dto.courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      grade.course = course;
    }

    if (dto.evaluationAttemptId) {
      const attempt = await this.gradesRepository.findEvaluationAttemptById(
        dto.evaluationAttemptId,
      );
      if (!attempt) {
        throw new NotFoundException('Evaluation attempt not found');
      }
      grade.evaluationAttempt = attempt;
    }

    return this.gradesRepository.saveGrade(grade);
  }

  async upsertGradeFromEvaluationAttempt(
    attemptId: string,
    options?: {
      graderId?: string;
      score?: number;
      feedback?: string;
      status?: string;
    },
  ): Promise<GradeEntity> {
    const attempt =
      await this.gradesRepository.findEvaluationAttemptById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Evaluation attempt not found');
    }

    const score = options?.score ?? Number(attempt.score ?? 0);
    const maxScore = Number(attempt.maxScore);
    this.assertValidScore(score, maxScore);

    const resolvedGraderId = options?.graderId ?? attempt.grader?.id;
    const gradedBy = resolvedGraderId
      ? ((await this.gradesRepository.findUserById(resolvedGraderId)) ??
        undefined)
      : undefined;
    if (resolvedGraderId && !gradedBy) {
      throw new NotFoundException('Grader user not found');
    }

    const existingGrade =
      await this.gradesRepository.findGradeByEvaluationAttemptId(attempt.id);
    const grade = existingGrade ?? new GradeEntity();
    grade.title = attempt.evaluation.title;
    grade.type = 'EVALUATION';
    grade.score = score.toFixed(2);
    grade.maxScore = maxScore.toFixed(2);
    grade.percentage = this.computePercentage(score, maxScore).toFixed(2);
    grade.feedback = options?.feedback ?? attempt.feedback;
    grade.status = options?.status ?? existingGrade?.status ?? 'PUBLISHED';
    grade.gradedAt = new Date();
    grade.student = attempt.student;
    grade.gradedBy = gradedBy;
    grade.course = attempt.evaluation.course;
    grade.evaluationAttempt = attempt;

    return this.gradesRepository.saveGrade(grade);
  }

  async updateGrade(
    gradeId: string,
    dto: UpdateGradeDto,
  ): Promise<GradeEntity> {
    const grade = await this.getGradeById(gradeId);

    const nextScore = dto.score ?? Number(grade.score);
    const nextMaxScore = dto.maxScore ?? Number(grade.maxScore);
    this.assertValidScore(nextScore, nextMaxScore);

    grade.title = dto.title ?? grade.title;
    grade.type = dto.type ? dto.type.toUpperCase() : grade.type;
    grade.score = nextScore.toFixed(2);
    grade.maxScore = nextMaxScore.toFixed(2);
    grade.percentage = this.computePercentage(nextScore, nextMaxScore).toFixed(
      2,
    );
    grade.weight =
      dto.weight !== undefined ? dto.weight.toFixed(2) : grade.weight;
    grade.feedback = dto.feedback ?? grade.feedback;
    grade.status = dto.status ? dto.status.toUpperCase() : grade.status;
    grade.gradedAt = dto.gradedAt ? new Date(dto.gradedAt) : grade.gradedAt;

    if (dto.courseId) {
      const course = await this.gradesRepository.findCourseById(dto.courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      grade.course = course;
    }

    return this.gradesRepository.saveGrade(grade);
  }

  async publishGrade(gradeId: string): Promise<GradeEntity> {
    const grade = await this.getGradeById(gradeId);
    if (grade.status === 'PUBLISHED') {
      throw new ConflictException('Grade already published');
    }

    grade.status = 'PUBLISHED';
    return this.gradesRepository.saveGrade(grade);
  }

  async deleteGrade(gradeId: string): Promise<void> {
    const grade = await this.getGradeById(gradeId);
    await this.gradesRepository.softDeleteGrade(grade);
  }

  private async buildLeaderboardEntries(): Promise<GradeLeaderboardResponseDto[]> {
    const [grades, submissions] = await Promise.all([
      this.gradesRepository.findPublishedGradesForLeaderboard(),
      this.submissionsRepository.findSubmissionsForLeaderboard(),
    ]);
    const leaderboardMap = new Map<string, LeaderboardAggregate>();

    for (const grade of grades) {
      const studentId = grade.student?.id;
      if (!studentId) {
        continue;
      }

      const aggregate = this.getOrCreateAggregate(leaderboardMap, {
        avatarUrl: grade.student.avatarUrl,
        email: grade.student.email,
        firstName: grade.student.firstName,
        id: grade.student.id,
        lastName: grade.student.lastName,
      });

      aggregate.publishedGradesCount += 1;
      aggregate.totalPercentage += Number(grade.percentage);
      aggregate.totalScore += Number(grade.score);
      aggregate.totalMaxScore += Number(grade.maxScore);

      if (grade.course?.id) {
        aggregate.courses.add(grade.course.id);
      }

      if (
        grade.gradedAt &&
        (!aggregate.latestGradedAt || grade.gradedAt > aggregate.latestGradedAt)
      ) {
        aggregate.latestGradedAt = grade.gradedAt;
      }

      this.captureActivityDay(aggregate.activityDays, grade.gradedAt);
    }

    for (const submission of submissions) {
      const studentId = submission.requester?.id;
      if (!studentId) {
        continue;
      }

      const aggregate = this.getOrCreateAggregate(leaderboardMap, {
        avatarUrl: submission.requester.avatarUrl,
        email: submission.requester.email,
        firstName: submission.requester.firstName,
        id: submission.requester.id,
        lastName: submission.requester.lastName,
      });

      aggregate.totalSubmissionsCount += 1;

      if (submission.verdict === 'ACCEPTED') {
        aggregate.acceptedSubmissionsCount += 1;

        if (submission.problem?.id) {
          aggregate.solvedProblems.add(submission.problem.id);
        }
      }

      const submissionDate = submission.evaluatedAt ?? submission.submittedAt;
      if (
        submissionDate &&
        (!aggregate.latestSubmissionAt ||
          submissionDate > aggregate.latestSubmissionAt)
      ) {
        aggregate.latestSubmissionAt = submissionDate;
      }

      this.captureActivityDay(aggregate.activityDays, submission.submittedAt);
    }

    return Array.from(leaderboardMap.values())
      .map((entry) => this.toGamificationMetrics(entry))
      .sort((left, right) => this.compareLeaderboardEntries(left, right))
      .map((entry, index) => {
        const rank = index + 1;
        return {
          rank,
          ...entry,
          badges: this.buildBadges(rank, entry),
          achievements: this.buildAchievements(rank, entry),
        };
      });
  }

  private getOrCreateAggregate(
    leaderboardMap: Map<string, LeaderboardAggregate>,
    student: GradeGamificationMetricsResponseDto['student'],
  ): LeaderboardAggregate {
    const existingAggregate = leaderboardMap.get(student.id);
    if (existingAggregate) {
      return existingAggregate;
    }

    const aggregate: LeaderboardAggregate = {
      student,
      publishedGradesCount: 0,
      courses: new Set<string>(),
      totalPercentage: 0,
      totalScore: 0,
      totalMaxScore: 0,
      totalSubmissionsCount: 0,
      acceptedSubmissionsCount: 0,
      solvedProblems: new Set<string>(),
      activityDays: new Set<string>(),
      latestGradedAt: undefined,
      latestSubmissionAt: undefined,
    };
    leaderboardMap.set(student.id, aggregate);
    return aggregate;
  }

  private toGamificationMetrics(
    entry: LeaderboardAggregate,
  ): ResolvedGamificationMetrics {
    const averagePercentage =
      entry.publishedGradesCount > 0
        ? Number((entry.totalPercentage / entry.publishedGradesCount).toFixed(2))
        : 0;
    const solvedProblemsCount = entry.solvedProblems.size;
    const acceptanceRate =
      entry.totalSubmissionsCount > 0
        ? Number(
            (
              (entry.acceptedSubmissionsCount / entry.totalSubmissionsCount) *
              100
            ).toFixed(2),
          )
        : 0;
    const activityStreakDays = this.computeActivityStreakDays(entry.activityDays);
    const latestSubmissionAt = entry.latestSubmissionAt;
    const latestGradedAt = entry.latestGradedAt;
    const lastActivityAt = this.pickLatestDate(latestGradedAt, latestSubmissionAt);
    const totalXp = this.computeTotalXp({
      acceptanceRate,
      acceptedSubmissionsCount: entry.acceptedSubmissionsCount,
      activityStreakDays,
      averagePercentage,
      coursesCount: entry.courses.size,
      publishedGradesCount: entry.publishedGradesCount,
      solvedProblemsCount,
    });
    const levelProgress = this.resolveLevelProgress(totalXp);

    return {
      student: entry.student,
      publishedGradesCount: entry.publishedGradesCount,
      coursesCount: entry.courses.size,
      averagePercentage,
      totalScore: Number(entry.totalScore.toFixed(2)),
      totalMaxScore: Number(entry.totalMaxScore.toFixed(2)),
      totalSubmissionsCount: entry.totalSubmissionsCount,
      acceptedSubmissionsCount: entry.acceptedSubmissionsCount,
      solvedProblemsCount,
      acceptanceRate,
      activityStreakDays,
      totalXp,
      level: levelProgress.level,
      levelLabel: levelProgress.label,
      currentLevelXpFloor: levelProgress.floor,
      nextLevelXpTarget: levelProgress.nextTarget,
      progressToNextLevel: levelProgress.progressToNextLevel,
      latestGradedAt,
      latestSubmissionAt,
      lastActivityAt,
    };
  }

  private compareLeaderboardEntries(
    left: ResolvedGamificationMetrics,
    right: ResolvedGamificationMetrics,
  ): number {
    if (right.totalXp !== left.totalXp) {
      return right.totalXp - left.totalXp;
    }

    if (right.averagePercentage !== left.averagePercentage) {
      return right.averagePercentage - left.averagePercentage;
    }

    if (right.solvedProblemsCount !== left.solvedProblemsCount) {
      return right.solvedProblemsCount - left.solvedProblemsCount;
    }

    if (right.acceptedSubmissionsCount !== left.acceptedSubmissionsCount) {
      return right.acceptedSubmissionsCount - left.acceptedSubmissionsCount;
    }

    const leftLastActivityAt = left.lastActivityAt?.getTime() ?? 0;
    const rightLastActivityAt = right.lastActivityAt?.getTime() ?? 0;
    return rightLastActivityAt - leftLastActivityAt;
  }

  private computeTotalXp(input: {
    acceptanceRate: number;
    acceptedSubmissionsCount: number;
    activityStreakDays: number;
    averagePercentage: number;
    coursesCount: number;
    publishedGradesCount: number;
    solvedProblemsCount: number;
  }): number {
    const gradeXp = Math.round(input.averagePercentage * 4);
    const publishedGradesXp = input.publishedGradesCount * 35;
    const solvedProblemsXp = input.solvedProblemsCount * 60;
    const acceptedSubmissionsXp = input.acceptedSubmissionsCount * 15;
    const streakXp = Math.min(input.activityStreakDays, 14) * 20;
    const explorationXp = input.coursesCount * 25;
    const qualityXp =
      input.acceptanceRate >= 70 && input.acceptedSubmissionsCount > 0 ? 40 : 0;

    return (
      gradeXp +
      publishedGradesXp +
      solvedProblemsXp +
      acceptedSubmissionsXp +
      streakXp +
      explorationXp +
      qualityXp
    );
  }

  private buildBadges(
    rank: number,
    entry: ResolvedGamificationMetrics,
  ): string[] {
    const badges: string[] = [];

    if (rank <= 3) {
      badges.push('Podium');
    }
    if (entry.averagePercentage >= 90 && entry.publishedGradesCount > 0) {
      badges.push('Excellence');
    }
    if (entry.solvedProblemsCount >= 5) {
      badges.push('Problem Hunter');
    }
    if (entry.activityStreakDays >= 7) {
      badges.push('Iron Streak');
    }
    if (entry.acceptanceRate >= 80 && entry.totalSubmissionsCount >= 5) {
      badges.push('Precision');
    }
    if (entry.totalSubmissionsCount >= 5) {
      badges.push('Actif');
    }
    if (entry.level >= 5) {
      badges.push('Elite');
    }

    return badges.slice(0, 4);
  }

  private buildAchievements(
    rank: number,
    entry: ResolvedGamificationMetrics,
  ): GradeGamificationAchievementResponseDto[] {
    const achievements: GradeGamificationAchievementResponseDto[] = [];
    const gradeAnchor = entry.latestGradedAt ?? entry.lastActivityAt;
    const codeAnchor = entry.latestSubmissionAt ?? entry.lastActivityAt;
    const activityAnchor = entry.lastActivityAt;

    if (entry.totalSubmissionsCount >= 1) {
      achievements.push({
        key: 'first-submission',
        label: 'Premier commit',
        description: 'Votre premiere soumission de code a ete enregistree.',
        tone: 'solver',
        unlockedAt: codeAnchor,
      });
    }

    if (entry.acceptedSubmissionsCount >= 1) {
      achievements.push({
        key: 'first-accepted',
        label: 'Probleme resolu',
        description: 'Vous avez obtenu votre premiere soumission acceptee.',
        tone: 'solver',
        unlockedAt: codeAnchor,
      });
    }

    if (entry.solvedProblemsCount >= 3) {
      achievements.push({
        key: 'triple-solver',
        label: 'Triple solver',
        description: 'Trois problemes distincts ont deja ete resolus.',
        tone: 'solver',
        unlockedAt: codeAnchor,
      });
    }

    if (entry.acceptanceRate >= 80 && entry.totalSubmissionsCount >= 5) {
      achievements.push({
        key: 'precision',
        label: 'Precision',
        description: 'Votre taux de reussite depasse 80 % sur un vrai volume de soumissions.',
        tone: 'grade',
        unlockedAt: codeAnchor,
      });
    }

    if (entry.publishedGradesCount >= 1) {
      achievements.push({
        key: 'first-grade',
        label: 'Evaluation publiee',
        description: 'Une premiere note publiee compte maintenant dans votre progression.',
        tone: 'grade',
        unlockedAt: gradeAnchor,
      });
    }

    if (entry.averagePercentage >= 90 && entry.publishedGradesCount >= 1) {
      achievements.push({
        key: 'excellence',
        label: 'Excellence',
        description: 'Votre moyenne publiee atteint 90 % ou plus.',
        tone: 'grade',
        unlockedAt: gradeAnchor,
      });
    }

    if (entry.activityStreakDays >= 3) {
      achievements.push({
        key: 'streak-3',
        label: 'Serie 3 jours',
        description: 'Vous avez maintenu trois jours consecutifs d activite.',
        tone: 'streak',
        unlockedAt: activityAnchor,
      });
    }

    if (entry.activityStreakDays >= 7) {
      achievements.push({
        key: 'streak-7',
        label: 'Serie 7 jours',
        description: 'Une semaine complete d engagement consecutive.',
        tone: 'streak',
        unlockedAt: activityAnchor,
      });
    }

    if (entry.totalXp >= 250) {
      achievements.push({
        key: 'xp-250',
        label: 'XP 250',
        description: 'Vous avez franchi le premier gros palier de progression.',
        tone: 'xp',
        unlockedAt: activityAnchor,
      });
    }

    if (entry.totalXp >= 500) {
      achievements.push({
        key: 'xp-500',
        label: 'XP 500',
        description: 'Votre progression vous place parmi les profils les plus engages.',
        tone: 'xp',
        unlockedAt: activityAnchor,
      });
    }

    if (rank <= 3) {
      achievements.push({
        key: 'podium',
        label: 'Podium',
        description: 'Vous faites partie des trois premiers du classement actuel.',
        tone: 'rank',
        unlockedAt: activityAnchor,
      });
    }

    return achievements
      .sort((left, right) => {
        const leftTime = left.unlockedAt?.getTime() ?? 0;
        const rightTime = right.unlockedAt?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .slice(0, 8);
  }

  private resolveLevelProgress(totalXp: number): {
    level: number;
    label: string;
    floor: number;
    nextTarget: number;
    progressToNextLevel: number;
  } {
    let currentLevel: (typeof LEVEL_STEPS)[number] = LEVEL_STEPS[0];
    let levelIndex = 0;

    for (let index = 0; index < LEVEL_STEPS.length; index += 1) {
      if (totalXp >= LEVEL_STEPS[index].floor) {
        currentLevel = LEVEL_STEPS[index];
        levelIndex = index;
      }
    }

    const nextLevel = LEVEL_STEPS[levelIndex + 1];
    const nextTarget = nextLevel?.floor ?? currentLevel.floor + 400;
    const delta = Math.max(1, nextTarget - currentLevel.floor);
    const progressToNextLevel = Math.max(
      0,
      Math.min(
        100,
        Math.round(((totalXp - currentLevel.floor) / delta) * 100),
      ),
    );

    return {
      level: levelIndex + 1,
      label: currentLevel.label,
      floor: currentLevel.floor,
      nextTarget,
      progressToNextLevel,
    };
  }

  private computeActivityStreakDays(activityDays: Set<string>): number {
    if (activityDays.size === 0) {
      return 0;
    }

    const sortedDays = Array.from(activityDays).sort((left, right) =>
      right.localeCompare(left),
    );
    let streak = 1;

    for (let index = 1; index < sortedDays.length; index += 1) {
      const previousDay = new Date(`${sortedDays[index - 1]}T00:00:00.000Z`);
      const currentDay = new Date(`${sortedDays[index]}T00:00:00.000Z`);
      const deltaDays = Math.round(
        (previousDay.getTime() - currentDay.getTime()) / 86400000,
      );

      if (deltaDays !== 1) {
        break;
      }

      streak += 1;
    }

    return streak;
  }

  private captureActivityDay(activityDays: Set<string>, value?: Date): void {
    if (!value) {
      return;
    }

    activityDays.add(value.toISOString().slice(0, 10));
  }

  private pickLatestDate(left?: Date, right?: Date): Date | undefined {
    if (left && right) {
      return left > right ? left : right;
    }

    return left ?? right;
  }

  private assertValidScore(score: number, maxScore: number): void {
    if (score < 0 || maxScore <= 0 || score > maxScore) {
      throw new ConflictException('Invalid score values');
    }
  }

  private computePercentage(score: number, maxScore: number): number {
    return (score / maxScore) * 100;
  }
}
