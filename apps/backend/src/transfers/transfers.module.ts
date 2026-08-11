import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TransferController } from './controllers/transfer.controller';
import { TransferMapper } from './mappers/transfer.mapper';
import { TransferPolicy } from './policies/transfer.policy';
import { TransferRepository } from './repositories/transfer.repository';
import { BankDirectoryService } from './services/bank-directory.service';
import { TransferService } from './services/transfer.service';
import { TransferValidator } from './validators/transfer.validator';

@Module({
  imports: [EventEmitterModule.forRoot(), PrismaModule, AccountsModule, TransactionsModule],
  controllers: [TransferController],
  providers: [TransferService, TransferRepository, TransferPolicy, TransferValidator, TransferMapper, BankDirectoryService],
  exports: [TransferService, TransferRepository, TransferPolicy, TransferValidator, TransferMapper, BankDirectoryService],
})
export class TransfersModule {}
