import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CardService } from '../card.service';
import { CardRepository } from '../../repositories/card.repository';
import { CardPolicy } from '../../policies/card.policy';
import { CardValidator } from '../../validators/card.validator';
import { CardMapper } from '../../mappers/card.mapper';
import { AccountService } from '../../../accounts/services/account.service';
import { TransactionService } from '../../../transactions/services/transaction.service';
import { LedgerService } from '../../../ledger/services/ledger.service';
import { CardType, CardTransactionType } from '../../enums/card.enums';

describe('CardService', () => {
  it('issues a card for a valid account holder', async () => {
    const accountService = {
      findById: jest.fn().mockResolvedValue({ id: 'acc-1', status: 'ACTIVE' }),
      isAccountHolder: jest.fn().mockResolvedValue(true),
    };

    const module = await Test.createTestingModule({
      providers: [
        CardService,
        CardRepository,
        CardPolicy,
        CardValidator,
        CardMapper,
        { provide: AccountService, useValue: accountService },
        { provide: TransactionService, useValue: { createTransaction: jest.fn() } },
        { provide: LedgerService, useValue: { createHold: jest.fn(), releaseHold: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    const service = module.get(CardService);
    const card = await service.issueCard({ id: 'user-1' } as never, {
      accountId: 'acc-1',
      type: CardType.VIRTUAL_DEBIT,
      nickname: 'Travel',
      isDemo: true,
    } as never);

    expect(card.id).toBeDefined();
    expect(card.accountId).toBe('acc-1');
    expect(card.maskedNumber).toContain('•');
  });

  it('authorizes a card transaction through ledger hold and transaction service', async () => {
    const accountService = {
      findById: jest.fn().mockResolvedValue({ id: 'acc-2', status: 'ACTIVE', availableBalance: '1000.00', currentBalance: '1000.00' }),
      isAccountHolder: jest.fn().mockResolvedValue(true),
    };

    const transactionService = {
      createTransaction: jest.fn().mockResolvedValue({ id: 'txn-1', metadata: { authorizationCode: 'A123456789' } }),
      reverseTransaction: jest.fn(),
    };

    const ledgerService = {
      createHold: jest.fn().mockResolvedValue({ id: 'hold-1' }),
      releaseHold: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CardService,
        CardRepository,
        CardPolicy,
        CardValidator,
        CardMapper,
        { provide: AccountService, useValue: accountService },
        { provide: TransactionService, useValue: transactionService },
        { provide: LedgerService, useValue: ledgerService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    const service = module.get(CardService);

    const card = await service.issueCard({ id: 'user-2' } as never, {
      accountId: 'acc-2',
      type: CardType.VIRTUAL_DEBIT,
      isDemo: true,
      spendingControls: {
        dailyLimit: '500.00',
        monthlyLimit: '10000.00',
        perTransactionLimit: '250.00',
      },
    } as never);

    await service.activateCard({ id: 'user-2' } as never, card.id);

    const authorization = await service.authorizeTransaction({ id: 'user-2' } as never, card.id, {
      type: CardTransactionType.ONLINE_PURCHASE,
      amount: '25.00',
      currency: 'USD',
      merchantName: 'Atlas Store',
      isOnline: true,
    } as never);

    expect(authorization.status).toBe('AUTHORIZED');
    expect(ledgerService.createHold).toHaveBeenCalledTimes(1);
    expect(transactionService.createTransaction).toHaveBeenCalledTimes(1);
  });
});
