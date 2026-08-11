import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
  imports: [EventEmitterModule.forRoot()],
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
