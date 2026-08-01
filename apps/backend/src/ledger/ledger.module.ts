import { Module } from '@nestjs/common';
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
  controllers: [LedgerController],
  providers: [
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