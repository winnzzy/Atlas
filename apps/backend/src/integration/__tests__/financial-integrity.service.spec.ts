import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'node:crypto';
import { FinancialIntegrityService } from '../financial-integrity.service';
import { IdempotencyService } from '../idempotency.service';
import { RequestContextService } from '../../common/request-context.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { Journal, JournalEntry, LedgerAccountId, Money, PostingType } from '@atlas/domain';
import type { AccountService } from '../../accounts/services/account.service';
import type { AccountRepository } from '../../accounts/repositories/account.repository';
import type { LedgerService } from '../../ledger/services/ledger.service';
import type { FinancialAuditService } from '../financial-audit.service';
import type { EventEmitter2 } from '@nestjs/event-emitter';

describe('FinancialIntegrityService', () => {
  const accountId = randomUUID();
  const user = { id: randomUUID(), role: 'USER' } as never;

  let accountService: jest.Mocked<Pick<AccountService, 'createAccount'>>;
  let accountRepository: jest.Mocked<Pick<AccountRepository, 'findByIdAndUser'>>;
  let ledgerService: jest.Mocked<Pick<LedgerService, 'createSnapshot' | 'restoreSnapshot' | 'postJournal' | 'findPostingsByJournalId'>>;
  let financialAuditService: jest.Mocked<Pick<FinancialAuditService, 'log'>>;
  let requestContext: RequestContextService;
  let prisma: jest.Mocked<Pick<PrismaService, '$transaction' | 'bankAccount'>>;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let service: FinancialIntegrityService;

  beforeEach(() => {
    accountService = {
      createAccount: jest.fn(),
    };

    accountRepository = {
      findByIdAndUser: jest.fn(),
    };

    ledgerService = {
      createSnapshot: jest.fn().mockReturnValue({ journalIds: [] }),
      restoreSnapshot: jest.fn(),
      postJournal: jest.fn(),
      findPostingsByJournalId: jest.fn(),
    };

    financialAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma as never)),
      bankAccount: {
        findUnique: jest.fn().mockResolvedValue({
          id: accountId,
          currentBalance: new Decimal(0),
          availableBalance: new Decimal(0),
          holdAmount: new Decimal(0),
          overdraftLimit: new Decimal(1000),
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as never;

    eventEmitter = {
      emit: jest.fn(),
    };

    requestContext = new RequestContextService();

    service = new FinancialIntegrityService(
      accountService as never,
      accountRepository as never,
      ledgerService as never,
      new IdempotencyService(),
      financialAuditService as never,
      requestContext,
      prisma as never,
      eventEmitter as never,
    );
  });

  it('posts a journal once and replays duplicate requests', async () => {
    const entryDate = new Date().toISOString();
    const requestBody = {
      type: 'TRANSFER',
      entryDate,
      description: 'Integration transfer',
      lines: [
        { accountId, side: 'DEBIT', amount: '10000' },
        { accountId, side: 'CREDIT', amount: '10000' },
      ],
    };

    const journal = Journal.create({
      description: 'Integration transfer',
      postingType: PostingType.TRANSFER,
      entries: [
        JournalEntry.debit(LedgerAccountId.from(accountId), Money.fromMinorUnits(10000n, 'USD')),
        JournalEntry.credit(LedgerAccountId.from(accountId), Money.fromMinorUnits(10000n, 'USD')),
      ],
    });

    ledgerService.postJournal.mockResolvedValue(journal as never);
    ledgerService.findPostingsByJournalId.mockResolvedValue([
      {
        id: LedgerAccountId.from(accountId) as never,
        journalId: journal.id,
        accountId: LedgerAccountId.from(accountId),
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: 'DEBIT',
        postingType: PostingType.TRANSFER,
        status: 'POSTED',
        createdAt: new Date(),
        isDebit: true,
        isCredit: false,
      },
      {
        id: LedgerAccountId.from(accountId) as never,
        journalId: journal.id,
        accountId: LedgerAccountId.from(accountId),
        amount: Money.fromMinorUnits(10000n, 'USD'),
        side: 'CREDIT',
        postingType: PostingType.TRANSFER,
        status: 'POSTED',
        createdAt: new Date(),
        isDebit: false,
        isCredit: true,
      },
    ] as never);

    accountRepository.findByIdAndUser.mockResolvedValue({
      id: accountId,
      status: 'ACTIVE',
    } as never);

    const request = {
      headers: { 'idempotency-key': 'idem-1' },
    } as never;

    const first = await service.postJournal(user, requestBody as never, request);

    const second = await service.postJournal(user, requestBody as never, request);

    expect(ledgerService.postJournal).toHaveBeenCalledTimes(1);
    expect(first.body.id.value).toBe(journal.id.value);
    expect(second.body.id.value).toBe(journal.id.value);
    expect(financialAuditService.log).toHaveBeenCalledTimes(1);
  });
});