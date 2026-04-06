import { Controller, Get, Query } from '@nestjs/common';
import { ANALYTICS_PERMISSIONS } from '../../core/constants';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { AnalyticsService } from './analytics.service';
import { AnalyticsActivityResponseDto } from './dto/analytics-activity-response.dto';
import { AnalyticsOverviewResponseDto } from './dto/analytics-overview-response.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(ANALYTICS_PERMISSIONS.ANALYTICS_DASHBOARD_READ)
  @Get('overview')
  async getOverview(): Promise<AnalyticsOverviewResponseDto> {
    return this.analyticsService.getOverview();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(ANALYTICS_PERMISSIONS.ANALYTICS_ACTIVITY_READ)
  @Get('activity')
  async getActivity(
    @Query('days') days?: string,
  ): Promise<AnalyticsActivityResponseDto> {
    const parsedDays = days ? Number(days) : 30;
    return this.analyticsService.getActivity(parsedDays);
  }
}
