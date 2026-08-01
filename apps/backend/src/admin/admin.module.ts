import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { CardsModule } from '../cards/cards.module';
import { InvestmentsModule } from '../investments/investments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { TransfersModule } from '../transfers/transfers.module';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminManagementController } from './controllers/admin-management.controller';
import { AdminSystemController } from './controllers/admin-system.controller';
import { AdminMapper } from './mappers/admin.mapper';
import { AdminPolicy } from './policies/admin.policy';
import { AdminRepository } from './repositories/admin.repository';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminAuditService } from './services/admin-audit.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminOrchestrationService } from './services/admin-orchestration.service';
import { AdminReportingService } from './services/admin-reporting.service';
import { AdminSearchService } from './services/admin-search.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminValidator } from './validators/admin.validator';

@Module({
  imports: [
    PrismaModule,
    AccountsModule,
    CardsModule,
    TransactionsModule,
    TransfersModule,
    InvestmentsModule,
    NotificationsModule,
  ],
  controllers: [AdminDashboardController, AdminManagementController, AdminSystemController],
  providers: [
    AdminPolicy,
    AdminValidator,
    AdminMapper,
    AdminRepository,
    AdminDashboardService,
    AdminAnalyticsService,
    AdminSearchService,
    AdminAuditService,
    AdminReportingService,
    AdminSettingsService,
    AdminOrchestrationService,
  ],
  exports: [
    AdminPolicy,
    AdminRepository,
    AdminDashboardService,
    AdminAnalyticsService,
    AdminSearchService,
    AdminAuditService,
    AdminReportingService,
    AdminSettingsService,
    AdminOrchestrationService,
  ],
})
export class AdminModule {}
