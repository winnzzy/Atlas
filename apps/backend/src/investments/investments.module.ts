import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CommonModule } from '../common/common.module';

// Repositories
import { InvestmentRepository } from './repositories/investment.repository';

// Mappers
import { InvestmentMapper } from './mappers/investment.mapper';

// Validators
import { InvestmentValidator } from './validators/investment.validator';

// Policies
import { InvestmentPolicy } from './policies/investment.policy';

// Services
import { AssetService } from './services/asset.service';
import { PricingService } from './services/pricing.service';
import { WalletService } from './services/wallet.service';
import { DepositService } from './services/deposit.service';
import { WithdrawalService } from './services/withdrawal.service';
import { ApprovalService } from './services/approval.service';
import { PortfolioService } from './services/portfolio.service';

// Controllers
import { InvestmentController } from './controllers/investment.controller';

@Module({
  imports: [
    PrismaModule,
    TransactionsModule,
    CommonModule,
  ],
  controllers: [InvestmentController],
  providers: [
    // Core
    InvestmentRepository,
    InvestmentMapper,
    InvestmentValidator,
    InvestmentPolicy,

    // Services
    AssetService,
    PricingService,
    WalletService,
    DepositService,
    WithdrawalService,
    ApprovalService,
    PortfolioService,
  ],
  exports: [
    AssetService,
    PricingService,
    WalletService,
    DepositService,
    WithdrawalService,
    ApprovalService,
    PortfolioService,
    InvestmentRepository,
  ],
})
export class InvestmentsModule {}