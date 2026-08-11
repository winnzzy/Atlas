import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AdminRole } from '../dto';
import { AdminDashboardOverviewDto } from '../dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminPolicy } from '../policies/admin.policy';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly analyticsService: AdminAnalyticsService,
    private readonly policy: AdminPolicy,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, type: AdminDashboardOverviewDto })
  getOverview(@Headers('x-admin-role') role: AdminRole): Promise<AdminDashboardOverviewDto> {
    this.policy.assertAllowed(role, 'dashboard.read');
    return this.dashboardService.getOverview();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics KPIs for operations and finance' })
  @ApiResponse({ status: 200, type: Object })
  getAnalytics(@Headers('x-admin-role') role: AdminRole) {
    this.policy.assertAllowed(role, 'analytics.read');
    return this.analyticsService.getAnalytics();
  }
}
