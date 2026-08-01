import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AccountsModule } from '../accounts/accounts.module';
import { LedgerModule } from '../ledger/ledger.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CardController } from './controllers/card.controller';
import { CardMapper } from './mappers/card.mapper';
import { CardPolicy } from './policies/card.policy';
import { CardRepository } from './repositories/card.repository';
import { CardService } from './services/card.service';
import { CardValidator } from './validators/card.validator';

@Module({
  imports: [EventEmitterModule.forRoot(), AccountsModule, LedgerModule, TransactionsModule],
  controllers: [CardController],
  providers: [CardService, CardRepository, CardPolicy, CardValidator, CardMapper],
  exports: [CardService, CardRepository, CardPolicy, CardValidator, CardMapper],
})
export class CardsModule {}
