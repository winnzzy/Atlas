import { Injectable } from '@nestjs/common';
import type {
  AdminAuditLogDto,
  AdminDashboardOverviewDto,
  AdminReportDto,
  AdminSearchResultDto,
  AdminSearchResultItemDto,
  AdminSettingsDto,
} from '../dto';

@Injectable()
export class AdminMapper {
  toDashboard(input: AdminDashboardOverviewDto): AdminDashboardOverviewDto {
    return input;
  }

  toSearch(items: AdminSearchResultItemDto[], total: number, limit: number, offset: number): AdminSearchResultDto {
    return { items, total, limit, offset };
  }

  toAuditLog(input: AdminAuditLogDto): AdminAuditLogDto {
    return input;
  }

  toReport(kind: string, rows: Array<Record<string, string | number | boolean | null>>): AdminReportDto {
    return {
      kind,
      generatedAt: new Date().toISOString(),
      rows,
    };
  }

  toSettings(input: AdminSettingsDto): AdminSettingsDto {
    return input;
  }
}
