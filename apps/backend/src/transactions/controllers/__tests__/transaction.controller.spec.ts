import { Test, type TestingModule } from '@nestjs/testing';
import { TransactionController } from '../transaction.controller';
import { TransactionService } from '../../services/transaction.service';
import { TransactionType } from '../../enums/transaction-type.enum';
import { TransactionStatus } from '../../enums/transaction-status.enum';

const serviceMock = {
  createTransaction: jest.fn(),
  createTransactionForUser: jest.fn(),
  searchTransactions: jest.fn(),
  searchTransactionsForUser: jest.fn(),
  getTransaction: jest.fn(),
  getTransactionForUser: jest.fn(),
  cancelTransaction: jest.fn(),
  reverseTransaction: jest.fn(),
  getAccountTransactions: jest.fn(),
  generateStatement: jest.fn(),
};

function makeTransaction(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 'txn-1',
    reference: 'TXN-20260718-ABC123',
    idempotencyKey: 'idem-key-1',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    accountId: 'acct-1',
    amount: '100.00',
    currency: 'USD',
    description: 'Test deposit',
    counterpartyAccountId: null,
    metadata: null,
    journalId: 'jrn-1',
    failureReason: null,
    failureCode: null,
    reversalId: null,
    reversalOfId: null,
    createdBy: 'user-1',
    authorizedBy: null,
    postedBy: null,
    settledBy: null,
    createdAt: now,
    updatedAt: now,
    authorizedAt: null,
    postedAt: null,
    settledAt: null,
    completedAt: now,
    failedAt: null,
    cancelledAt: null,
    reversedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(async () => {
    for (const value of Object.values(serviceMock)) {
      value.mockReset();
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [{ provide: TransactionService, useValue: serviceMock }],
    }).compile();

    controller = module.get(TransactionController);
  });

  it('creates a transaction scoped to the authenticated user', async () => {
    serviceMock.createTransactionForUser.mockResolvedValue(makeTransaction() as never);

    const user = { id: 'user-1' } as never;
    const dto = {
      type: TransactionType.DEPOSIT,
      accountId: 'acct-1',
      amount: '100.00',
      currency: 'USD',
      idempotencyKey: 'idem-key-1',
      description: 'Test deposit',
    } as never;
    const result = await controller.createTransaction(user, dto);

    expect(serviceMock.createTransactionForUser).toHaveBeenCalledWith(user, dto);
    // The unscoped variant skips ownership checks and must never be reachable.
    expect(serviceMock.createTransaction).not.toHaveBeenCalled();
    expect(result.status).toBe(TransactionStatus.COMPLETED);
    expect(result.amount).toBe('100.00');
  });

  it('searches transactions', async () => {
    serviceMock.searchTransactionsForUser.mockResolvedValue({
      items: [makeTransaction()],
      nextCursor: undefined,
      totalCount: 1,
      limit: 20,
    } as never);

    const user = { id: 'user-1' } as never;
    const query = { type: TransactionType.DEPOSIT } as never;
    const result = await controller.searchTransactions(user, query);

    expect(serviceMock.searchTransactionsForUser).toHaveBeenCalledWith(user, query);
    expect(serviceMock.searchTransactions).not.toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it('gets a transaction by id scoped to the authenticated user', async () => {
    serviceMock.getTransactionForUser.mockResolvedValue(makeTransaction() as never);

    const user = { id: 'user-1' } as never;
    const result = await controller.getTransaction(user, 'txn-1');

    expect(result.id).toBe('txn-1');
    expect(serviceMock.getTransactionForUser).toHaveBeenCalledWith(user, 'txn-1');
    expect(serviceMock.getTransaction).not.toHaveBeenCalled();
  });

  it('cancels a transaction', async () => {
    serviceMock.cancelTransaction.mockResolvedValue(
      makeTransaction({ status: TransactionStatus.CANCELLED, cancelledAt: new Date() }) as never,
    );

    const result = await controller.cancelTransaction('txn-1', 'User cancelled');

    expect(result.status).toBe(TransactionStatus.CANCELLED);
    expect(serviceMock.cancelTransaction).toHaveBeenCalledWith('txn-1', 'User cancelled');
  });

  it('reverses a transaction', async () => {
    serviceMock.reverseTransaction.mockResolvedValue(
      makeTransaction({ status: TransactionStatus.REVERSED, reversedAt: new Date() }) as never,
    );

    const result = await controller.reverseTransaction('txn-1', 'Duplicate');

    expect(result.status).toBe(TransactionStatus.REVERSED);
    expect(serviceMock.reverseTransaction).toHaveBeenCalledWith('txn-1', 'Duplicate');
  });

  it('gets account transactions', async () => {
    serviceMock.getAccountTransactions.mockResolvedValue({
      items: [makeTransaction()],
      nextCursor: undefined,
      totalCount: 1,
      limit: 20,
    } as never);

    const result = await controller.getAccountTransactions('acct-1', 20, undefined);

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it('generates a statement', async () => {
    serviceMock.generateStatement.mockResolvedValue({
      accountId: 'acct-1',
      fromDate: '2026-07-01T00:00:00.000Z',
      toDate: '2026-07-18T00:00:00.000Z',
      entries: [],
      totalDebits: '0.00',
      totalCredits: '0.00',
      closingBalance: '0.00',
      generatedAt: new Date(),
      entryCount: 0,
    } as never);

    const result = await controller.generateStatement({
      accountId: 'acct-1',
      fromDate: '2026-07-01T00:00:00.000Z',
      toDate: '2026-07-18T00:00:00.000Z',
    } as never);

    expect(result.accountId).toBe('acct-1');
    expect(result.entryCount).toBe(0);
  });
});