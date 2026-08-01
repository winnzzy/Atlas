import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AccountsModule } from '../accounts/accounts.module';
import { LedgerModule } from '../ledger/ledger.module';
import { CommonModule } from '../common/common.module';
import { IdempotencyService } from './idempotency.service';
import { FinancialAuditService } from './financial-audit.service';
import { FinancialIntegrityService } from './financial-integrity.service';

@Module({
  imports: [PrismaModule, AuthModule, AccountsModule, LedgerModule, CommonModule],
  providers: [IdempotencyService, FinancialAuditService, FinancialIntegrityService],
  exports: [IdempotencyService, FinancialAuditService, FinancialIntegrityService],
})
export class IntegrationModule {}