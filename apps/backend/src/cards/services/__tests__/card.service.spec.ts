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
import { PrismaService } from '../../../prisma/prisma.service';
import { CardStatus, CardType, CardTransactionType } from '../../enums/card.enums';
import { createCardPrismaDouble } from './card-prisma.double';

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
        { provide: PrismaService, useValue: createCardPrismaDouble() },
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
    } as never);

    expect(card.id).toBeDefined();
    expect(card.accountId).toBe('acc-1');
    expect(card.maskedNumber).toContain('•');
    expect(card).not.toHaveProperty('isDemo');
  });

  it('holds a customer application at REQUESTED until an admin approves it', async () => {
    const accountService = {
      findById: jest.fn().mockResolvedValue({ id: 'acc-1', status: 'ACTIVE' }),
      isAccountHolder: jest.fn().mockResolvedValue(true),
    };

    const module = await Test.createTestingModule({
      providers: [
        CardService,
        CardRepository,
        { provide: PrismaService, useValue: createCardPrismaDouble() },
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
    const user = { id: 'user-1' } as never;

    const application = await service.issueCard(
      user,
      { accountId: 'acc-1', type: CardType.VIRTUAL_DEBIT } as never,
      { requiresApproval: true },
    );
    expect(application.status).toBe(CardStatus.REQUESTED);

    // A card awaiting review is not usable, so it cannot be frozen or activated.
    await expect(service.freezeCard(user, application.id)).rejects.toThrow();

    const approved = await service.approveCardApplication(user, application.id, 'admin-1');
    expect(approved.status).toBe(CardStatus.ACTIVATED);
  });

  it('approves an application straight to an active, usable card with no dead-end state', async () => {
    const accountService = {
      findById: jest.fn().mockResolvedValue({ id: 'acc-1', status: 'ACTIVE' }),
      isAccountHolder: jest.fn().mockResolvedValue(true),
    };
    const transactionService = { createTransaction: jest.fn() };
    const ledgerService = { createHold: jest.fn(), releaseHold: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CardService,
        CardRepository,
        { provide: PrismaService, useValue: createCardPrismaDouble() },
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
    const user = { id: 'user-1' } as never;

    const application = await service.issueCard(
      user,
      { accountId: 'acc-1', type: CardType.PHYSICAL_DEBIT } as never,
      { requiresApproval: true },
    );
    expect(application.status).toBe(CardStatus.REQUESTED);

    const approved = await service.approveCardApplication(user, application.id, 'admin-1');
    expect(approved.status).toBe(CardStatus.ACTIVATED);

    // The customer sees the now-active card, and approval moved no money.
    const owned = await service.searchCards(user, {} as never);
    expect(owned.items.find((card) => card.id === application.id)?.status).toBe(CardStatus.ACTIVATED);
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
    expect(ledgerService.createHold).not.toHaveBeenCalled();
  });

  it('approves a card already sitting in PENDING_VERIFICATION without an invalid-transition error', async () => {
    const accountService = {
      findById: jest.fn().mockResolvedValue({ id: 'acc-1', status: 'ACTIVE' }),
      isAccountHolder: jest.fn().mockResolvedValue(true),
    };

    const module = await Test.createTestingModule({
      providers: [
        CardService,
        CardRepository,
        { provide: PrismaService, useValue: createCardPrismaDouble() },
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
    const admin = { id: 'admin-1' } as never;

    // An admin-issued physical card lands in PENDING_VERIFICATION.
    const issued = await service.issueCard(admin, {
      accountId: 'acc-1',
      type: CardType.PHYSICAL_DEBIT,
    } as never);
    expect(issued.status).toBe(CardStatus.PENDING_VERIFICATION);

    // Approving it must advance it, not throw "cannot transition from PENDING_VERIFICATION".
    const approved = await service.approveCardApplication(admin, issued.id, 'admin-1');
    expect(approved.status).toBe(CardStatus.ACTIVATED);
  });

  it('rejects a card application and closes it', async () => {
    const accountService = {
      findById: jest.fn().mockResolvedValue({ id: 'acc-1', status: 'ACTIVE' }),
      isAccountHolder: jest.fn().mockResolvedValue(true),
    };

    const module = await Test.createTestingModule({
      providers: [
        CardService,
        CardRepository,
        { provide: PrismaService, useValue: createCardPrismaDouble() },
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
    const user = { id: 'user-1' } as never;

    const application = await service.issueCard(
      user,
      { accountId: 'acc-1', type: CardType.VIRTUAL_DEBIT } as never,
      { requiresApproval: true },
    );

    const rejected = await service.rejectCardApplication(user, application.id, 'admin-1', 'Failed review');
    expect(rejected.status).toBe(CardStatus.CANCELLED);
    // A rejected application must not be approvable afterwards.
    await expect(service.approveCardApplication(user, application.id, 'admin-1')).rejects.toThrow();
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
        { provide: PrismaService, useValue: createCardPrismaDouble() },
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

  it('persists the application scoped to its customer/account and never exposes PAN or CVV', async () => {
    const accountService = {
      findById: jest.fn().mockResolvedValue({ id: 'acc-9', status: 'ACTIVE' }),
      isAccountHolder: jest.fn().mockResolvedValue(true),
    };
    const transactionService = { createTransaction: jest.fn() };
    const ledgerService = { createHold: jest.fn(), releaseHold: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CardService,
        CardRepository,
        { provide: PrismaService, useValue: createCardPrismaDouble() },
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
    const owner = { id: 'user-9' } as never;

    const application = await service.issueCard(
      owner,
      { accountId: 'acc-9', type: CardType.VIRTUAL_DEBIT } as never,
      { requiresApproval: true },
    );

    // The card is persisted and linked to the applying customer + account.
    const owned = await service.searchCards(owner, {} as never);
    expect(owned.items.map((card) => card.id)).toContain(application.id);
    expect(owned.items.find((card) => card.id === application.id)?.accountId).toBe('acc-9');

    // A different customer cannot see it.
    const other = await service.searchCards({ id: 'intruder' } as never, {} as never);
    expect(other.items).toHaveLength(0);

    // The customer response never carries the full PAN or any CVV.
    expect(application).not.toHaveProperty('cardNumber');
    expect(JSON.stringify(application).toLowerCase()).not.toContain('cvv');

    // Applying for a card touches neither a money transaction nor the ledger.
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
    expect(ledgerService.createHold).not.toHaveBeenCalled();
  });
});
