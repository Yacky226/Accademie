import { Injectable } from '@nestjs/common';
import { AnalyticsActivityResponseDto } from './dto/analytics-activity-response.dto';
import { AnalyticsOverviewResponseDto } from './dto/analytics-overview-response.dto';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getOverview(): Promise<AnalyticsOverviewResponseDto> {
    const [
      usersTotal,
      usersActive,
      coursesTotal,
      coursesPublished,
      enrollmentsTotal,
      programsTotal,
      problemsTotal,
      evaluationsTotal,
      submissionsTotal,
      gradesTotal,
      calendarEventsTotal,
      notificationsTotal,
    ] = await Promise.all([
      this.analyticsRepository.countUsersTotal(),
      this.analyticsRepository.countUsersActive(),
      this.analyticsRepository.countCoursesTotal(),
      this.analyticsRepository.countCoursesPublished(),
      this.analyticsRepository.countEnrollmentsTotal(),
      this.analyticsRepository.countProgramsTotal(),
      this.analyticsRepository.countProblemsTotal(),
      this.analyticsRepository.countEvaluationsTotal(),
      this.analyticsRepository.countSubmissionsTotal(),
      this.analyticsRepository.countGradesTotal(),
      this.analyticsRepository.countCalendarEventsTotal(),
      this.analyticsRepository.countNotificationsTotal(),
    ]);

    return {
      usersTotal,
      usersActive,
      coursesTotal,
      coursesPublished,
      enrollmentsTotal,
      programsTotal,
      problemsTotal,
      evaluationsTotal,
      submissionsTotal,
      gradesTotal,
      calendarEventsTotal,
      notificationsTotal,
    };
  }

  async getActivity(periodDays = 30): Promise<AnalyticsActivityResponseDto> {
    const normalizedPeriodDays = Number.isFinite(periodDays) && periodDays > 0 ? Math.floor(periodDays) : 30;
    const since = new Date();
    since.setDate(since.getDate() - normalizedPeriodDays);

    const [
      newUsers,
      newEnrollments,
      submissionsCreated,
      evaluationAttemptsStarted,
      notificationsSent,
    ] = await Promise.all([
      this.analyticsRepository.countNewUsersSince(since),
      this.analyticsRepository.countNewEnrollmentsSince(since),
      this.analyticsRepository.countSubmissionsSince(since),
      this.analyticsRepository.countEvaluationAttemptsSince(since),
      this.analyticsRepository.countNotificationsSince(since),
    ]);

    return {
      periodDays: normalizedPeriodDays,
      newUsers,
      newEnrollments,
      submissionsCreated,
      evaluationAttemptsStarted,
      notificationsSent,
    };
  }
}
