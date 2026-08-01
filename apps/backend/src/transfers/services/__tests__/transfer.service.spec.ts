import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransferService } from '../transfer.service';
import { TransferRepository } from '../../repositories/transfer.repository';
import { TransferPolicy } from '../../policies/transfer.policy';
import { TransferValidator } from '../../validators/transfer.validator';
import { TransferMapper } from '../../mappers/transfer.mapper';
import { AccountService } from '../../../accounts/services/account.service';
import { TransactionService } from '../../../transactions/services/transaction.service';
import { TransferType } from '../../enums/transfer-type.enum';

describe('TransferService', () => {
  it('creates an immediate internal transfer using the transaction engine', async () => {
    const accountService = { findById: jest.fn().mockResolvedValue({ status: 'ACTIVE', availableBalance: '100.00' }) };
    const transactionService = { createTransaction: jest.fn().mockResolvedValue({ id: 'txn-1', reference: 'TXN-1' }) };
    const module = await Test.createTestingModule({
      providers: [
        TransferService,
        TransferRepository,
        TransferPolicy,
        TransferValidator,
        TransferMapper,
        { provide: AccountService, useValue: accountService },
        { provide: TransactionService, useValue: transactionService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    const service = module.get(TransferService);
    const result = await service.createTransfer({ id: 'user-1' } as never, {
      type: TransferType.INTERNAL,
      sourceAccountId: '11111111-1111-1111-1111-111111111111',
      destinationAccountId: '22222222-2222-2222-2222-222222222222',
      amount: '10.00',
      currency: 'USD',
    } as never);

    expect(result.status).toBe('COMPLETED');
    expect(transactionService.createTransaction).toHaveBeenCalledTimes(1);
  });
});
