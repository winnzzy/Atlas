import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AccountsModule } from '../accounts/accounts.module';
import { CardsModule } from '../cards/cards.module';
import { InvestmentsModule } from '../investments/investments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { TransfersModule } from '../transfers/transfers.module';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminManagementController } from './controllers/admin-management.controller';
import { AdminSystemController } from './controllers/admin-system.controller';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminMapper } from './mappers/admin.mapper';
import { AdminPolicy } from './policies/admin.policy';
import { AdminRepository } from './repositories/admin.repository';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { AdminAuditService } from './services/admin-audit.service';
import { AdminCustomerService } from './services/admin-customer.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminHistoryGeneratorService } from './services/admin-history-generator.service';
import { AdminOrchestrationService } from './services/admin-orchestration.service';
import { AdminPresentationService } from './services/admin-presentation.service';
import { AdminProvisioningService } from './services/admin-provisioning.service';
import { AdminReportingService } from './services/admin-reporting.service';
import { AdminSearchService } from './services/admin-search.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminValidator } from './validators/admin.validator';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'local-dev-secret'),
      }),
    }),
    AccountsModule,
    CardsModule,
    TransactionsModule,
    TransfersModule,
    InvestmentsModule,
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [AdminDashboardController, AdminManagementController, AdminSystemController],
  providers: [
    AdminAuthGuard,
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
    AdminProvisioningService,
    AdminCustomerService,
    AdminPresentationService,
    AdminHistoryGeneratorService,
  ],
  exports: [
    AdminAuthGuard,
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
