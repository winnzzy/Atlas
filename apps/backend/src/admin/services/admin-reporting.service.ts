import { Injectable } from '@nestjs/common';
import type { AdminReportDto, AdminReportQueryDto } from '../dto';
import { AdminMapper } from '../mappers/admin.mapper';
import { AdminRepository } from '../repositories/admin.repository';

@Injectable()
export class AdminReportingService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly mapper: AdminMapper,
  ) {}

  async generateReport(query: AdminReportQueryDto): Promise<AdminReportDto> {
    const kind = query.kind ?? 'DAILY_VOLUME';
    const rows = await this.repository.getReportRows(
      kind,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );

    return this.mapper.toReport(kind, rows);
  }
}
