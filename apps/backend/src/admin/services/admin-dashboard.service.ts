import { Injectable } from '@nestjs/common';
import type { AdminDashboardOverviewDto } from '../dto';
import { AdminMapper } from '../mappers/admin.mapper';
import { AdminRepository } from '../repositories/admin.repository';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly mapper: AdminMapper,
  ) {}

  async getOverview(): Promise<AdminDashboardOverviewDto> {
    const overview = await this.repository.getDashboardOverview();
    return this.mapper.toDashboard(overview);
  }
}
