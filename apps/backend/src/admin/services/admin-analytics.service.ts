import { Injectable } from '@nestjs/common';
import type { AdminAnalyticsDto } from '../dto';
import { AdminRepository } from '../repositories/admin.repository';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly repository: AdminRepository) {}

  async getAnalytics(): Promise<AdminAnalyticsDto> {
    const analytics = await this.repository.getAnalytics();
    return {
      dailyKpis: analytics.dailyKpis,
      monthlyKpis: analytics.monthlyKpis,
      growth: analytics.growth,
      volume: analytics.volume,
      assetsUnderManagement: analytics.assetsUnderManagement,
      activeUsers: analytics.activeUsers,
    };
  }
}
