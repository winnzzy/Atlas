import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LedgerController } from './controllers/ledger.controller';
import { LedgerService } from './services/ledger.service';
import {
  JournalValidator,
  LedgerValidator,
  BalanceCalculator,
  PostingEngine,
  HoldEngine,
  SettlementEngine,
  ReversalEngine,
  ReconciliationEngine,
} from '@atlas/domain';

@Module({
  imports: [EventEmitterModule.forRoot(), PrismaModule],
  controllers: [LedgerController],
  providers: [
    RolesGuard,
    LedgerService,
    JournalValidator,
    LedgerValidator,
    BalanceCalculator,
    PostingEngine,
    HoldEngine,
    SettlementEngine,
    ReversalEngine,
    ReconciliationEngine,
  ],
  exports: [LedgerService],
})
export class LedgerModule {}
