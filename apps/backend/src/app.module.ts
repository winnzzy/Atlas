import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { CommonModule } from './common/common.module';
import { LedgerModule } from './ledger/ledger.module';
import { IntegrationModule } from './integration/integration.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransfersModule } from './transfers/transfers.module';
import { CardsModule } from './cards/cards.module';
import { InvestmentsModule } from './investments/investments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CommonModule,
    HealthModule,
    ProfileModule,
    AuthModule,
    AccountsModule,
    LedgerModule,
    IntegrationModule,
    TransactionsModule,
    TransfersModule,
    CardsModule,
    InvestmentsModule,
    NotificationsModule,
    AdminModule,
    SettingsModule,
  ],
})
export class AppModule {}
