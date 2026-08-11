import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { TransactionPolicy } from './policies/transaction.policy';
import { TransactionMapper } from './mappers/transaction.mapper';
import { LedgerModule } from '../ledger/ledger.module';
import { AccountsModule } from '../accounts/accounts.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    LedgerModule,
    AccountsModule,
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionRepository,
    TransactionPolicy,
    TransactionMapper,
  ],
  exports: [
    TransactionService,
    TransactionRepository,
    TransactionPolicy,
    TransactionMapper,
  ],
})
export class TransactionsModule {}
