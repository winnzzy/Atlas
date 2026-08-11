import { Body, Controller, Get, Headers, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuditQueryDto, AdminReportQueryDto, AdminSearchQueryDto, PaginationDto, UpdateAdminSettingsDto } from '../dto';
import type { AdminRole } from '../dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminPolicy } from '../policies/admin.policy';
import { AdminAuditService } from '../services/admin-audit.service';
import { AdminReportingService } from '../services/admin-reporting.service';
import { AdminSearchService } from '../services/admin-search.service';
import { AdminSettingsService } from '../services/admin-settings.service';

@ApiTags('Admin System')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminSystemController {
  constructor(
    private readonly searchService: AdminSearchService,
    private readonly auditService: AdminAuditService,
    private readonly reportingService: AdminReportingService,
    private readonly settingsService: AdminSettingsService,
    private readonly policy: AdminPolicy,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Global administration search' })
  @ApiResponse({ status: 200, type: Object })
  search(@Headers('x-admin-role') role: AdminRole, @Query() query: AdminSearchQueryDto) {
    this.policy.assertAllowed(role, 'search.read');
    return this.searchService.search(query);
  }

  @Get('audit/logs')
  @ApiOperation({ summary: 'View audit logs' })
  listAuditLogs(@Headers('x-admin-role') role: AdminRole, @Query() query: AdminAuditQueryDto) {
    this.policy.assertAllowed(role, 'audit.read');
    return this.auditService.listAuditLogs(query);
  }

  @Get('audit/security-events')
  @ApiOperation({ summary: 'View security events' })
  listSecurityEvents(@Headers('x-admin-role') role: AdminRole, @Query() query: PaginationDto) {
    this.policy.assertAllowed(role, 'audit.read');
    return this.auditService.listSecurityEvents(query);
  }

  @Get('audit/actions')
  @ApiOperation({ summary: 'View admin action logs' })
  listAdminActions(@Headers('x-admin-role') role: AdminRole, @Query() query: PaginationDto) {
    this.policy.assertAllowed(role, 'audit.read');
    return this.auditService.listAdminActions(query);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Generate admin report payloads' })
  generateReport(@Headers('x-admin-role') role: AdminRole, @Query() query: AdminReportQueryDto) {
    this.policy.assertAllowed(role, 'report.read');
    return this.reportingService.generateReport(query);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  getSettings(@Headers('x-admin-role') role: AdminRole) {
    this.policy.assertAllowed(role, 'settings.read');
    return this.settingsService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update mutable system settings' })
  updateSettings(@Headers('x-admin-role') role: AdminRole, @Body() body: UpdateAdminSettingsDto) {
    this.policy.assertAllowed(role, 'settings.write');
    return this.settingsService.updateSettings(body);
  }
}
