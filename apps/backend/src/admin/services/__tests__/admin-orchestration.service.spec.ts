import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminOrchestrationService } from '../admin-orchestration.service';

function buildService(overrides: Partial<Record<string, unknown>> = {}) {
  const repository = { findCardOwner: jest.fn().mockResolvedValue('customer-1') };
  const accountService = {
    findById: jest
      .fn()
      .mockResolvedValue({ id: 'acc-1', availableBalance: '100.00', currentBalance: '100.00' }),
  };
  const cardService = {
    freezeCard: jest.fn().mockResolvedValue({ id: 'card-1', status: 'FROZEN' }),
    unfreezeCard: jest.fn().mockResolvedValue({ id: 'card-1', status: 'ACTIVATED' }),
  };
  const transactionService = {
    createTransaction: jest.fn().mockResolvedValue({ id: 'txn-1', status: 'COMPLETED' }),
    adminDeleteTransaction: jest.fn().mockResolvedValue({ id: 'txn-1', deleted: true }),
    adminBulkDeleteTransactions: jest.fn().mockResolvedValue({ requested: 2, deleted: 2 }),
    adminClearAccountHistory: jest.fn().mockResolvedValue({ accountId: 'acc-1', deleted: 5 }),
  };
  const approvalService = {
    adminAdjustBalance: jest.fn().mockResolvedValue({
      userId: 'customer-1',
      productSymbol: 'BTC',
      direction: 'CREDIT',
      amount: 1,
      newQuantity: 1,
      reference: 'DEP-ABCDEF12',
      transactionId: 'inv-txn-1',
    }),
  };
  const prisma = {
    adminAction: { create: jest.fn().mockResolvedValue({ id: 'action-1' }) },
    accountHolder: { findMany: jest.fn().mockResolvedValue([{ accountId: 'acc-1' }]) },
    transaction: { findMany: jest.fn().mockResolvedValue([{ id: 'txn-a' }, { id: 'txn-b' }]) },
  };

  const service = new AdminOrchestrationService(
    repository as never,
    accountService as never,
    cardService as never,
    transactionService as never,
    {} as never,
    {} as never,
    {} as never,
    approvalService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    prisma as never,
  );
  Object.assign(service, overrides);
  return {
    service,
    repository,
    accountService,
    cardService,
    transactionService,
    approvalService,
    prisma,
  };
}

describe('AdminOrchestrationService.applyAccountAction — CREDIT/DEBIT', () => {
  it('never leaks the word "admin" into the transaction description or metadata', async () => {
    const { service, transactionService } = buildService();

    await service.applyAccountAction(
      'acc-1',
      { action: 'CREDIT', amount: '25.00', reason: 'goodwill', reference: 'ref-1' },
      'admin-1',
    );

    const call = transactionService.createTransaction.mock.calls[0]?.[0] as {
      description: string;
      metadata?: unknown;
    };
    expect(call.description.toLowerCase()).not.toContain('admin');
    expect(call.metadata).toBeUndefined();
  });

  it('records the real reason in the admin audit trail', async () => {
    const { service, prisma } = buildService();

    await service.applyAccountAction(
      'acc-1',
      { action: 'CREDIT', amount: '25.00', reason: 'goodwill credit', reference: 'ref-1' },
      'admin-1',
    );

    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ adminUserId: 'admin-1', action: 'ACCOUNT_CREDIT' }),
      }),
    );
  });

  it('rejects a DEBIT larger than the available balance unless forced', async () => {
    const { service, transactionService } = buildService();

    await expect(
      service.applyAccountAction(
        'acc-1',
        { action: 'DEBIT', amount: '500.00', reason: 'x', reference: 'ref-2' },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transactionService.createTransaction).not.toHaveBeenCalled();

    await service.applyAccountAction(
      'acc-1',
      { action: 'DEBIT', amount: '500.00', reason: 'x', reference: 'ref-2', force: true },
      'admin-1',
    );
    expect(transactionService.createTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects a non-positive amount', async () => {
    const { service } = buildService();
    await expect(
      service.applyAccountAction(
        'acc-1',
        { action: 'CREDIT', amount: '0', reason: 'x', reference: 'ref-3' },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AdminOrchestrationService.applyCardAction — FREEZE/UNFREEZE', () => {
  it('freezes and unfreezes using the real admin identity, and audits it', async () => {
    const { service, cardService, prisma } = buildService();

    await service.applyCardAction(
      'card-1',
      { action: 'FREEZE', reason: 'fraud review' },
      'admin-1',
    );
    expect(cardService.freezeCard).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
      'card-1',
      'fraud review',
    );
    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CARD_FREEZE' }) }),
    );

    await service.applyCardAction('card-1', { action: 'UNFREEZE' }, 'admin-1');
    expect(cardService.unfreezeCard).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
      'card-1',
    );
  });
});

describe('AdminOrchestrationService.applyInvestmentAction — ADMIN_CREDIT/ADMIN_DEBIT', () => {
  it('delegates to ApprovalService.adminAdjustBalance, always in USD, and audits with the real reason', async () => {
    const { service, approvalService, prisma } = buildService();

    const result = await service.applyInvestmentAction(
      {
        action: 'ADMIN_CREDIT',
        userId: 'customer-1',
        amount: 1,
        reason: 'goodwill',
      },
      'admin-1',
    );

    expect(approvalService.adminAdjustBalance).toHaveBeenCalledWith(
      'customer-1',
      'USD',
      'CREDIT',
      1,
      'admin-1',
      false,
    );
    expect(result).toEqual(expect.objectContaining({ productSymbol: 'BTC' }));
    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'INVESTMENT_ADMIN_CREDIT',
          details: expect.objectContaining({ currency: 'USD' }),
        }),
      }),
    );
  });

  it('ignores any symbol the caller passes — the action is always posted in USD', async () => {
    const { service, approvalService } = buildService();

    await service.applyInvestmentAction(
      {
        action: 'ADMIN_CREDIT',
        userId: 'customer-1',
        symbol: 'BTC',
        amount: 1,
        reason: 'goodwill',
      },
      'admin-1',
    );

    expect(approvalService.adminAdjustBalance).toHaveBeenCalledWith(
      'customer-1',
      'USD',
      'CREDIT',
      1,
      'admin-1',
      false,
    );
  });

  it('requires userId, amount and reason, but not a symbol', async () => {
    const { service } = buildService();
    await expect(
      service.applyInvestmentAction(
        { action: 'ADMIN_CREDIT', amount: 1, reason: 'x' } as never,
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.applyInvestmentAction(
        { action: 'ADMIN_CREDIT', userId: 'customer-1', amount: 1 } as never,
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('AdminOrchestrationService.bulkDeleteTransactions', () => {
  it("clears an account's entire history when accountId + all are given", async () => {
    const { service, transactionService } = buildService();

    const result = await service.bulkDeleteTransactions('admin-1', 'user-1', {
      accountId: 'acc-1',
      all: true,
    });

    expect(transactionService.adminClearAccountHistory).toHaveBeenCalledWith('acc-1', 'admin-1');
    expect(result.deleted).toBe(5);
  });

  it('rejects clearing an account that does not belong to the customer', async () => {
    const { service } = buildService();
    await expect(
      service.bulkDeleteTransactions('admin-1', 'user-1', { accountId: 'acc-other', all: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a specific set of owned transaction ids', async () => {
    const { service, transactionService, prisma } = buildService();
    prisma.transaction.findMany.mockResolvedValue([{ id: 'txn-a' }, { id: 'txn-b' }]);

    const result = await service.bulkDeleteTransactions('admin-1', 'user-1', {
      transactionIds: ['txn-a', 'txn-b'],
    });

    expect(transactionService.adminBulkDeleteTransactions).toHaveBeenCalledWith(
      ['txn-a', 'txn-b'],
      'admin-1',
    );
    expect(result.deleted).toBe(2);
  });

  it('rejects when a requested transaction id does not belong to the customer', async () => {
    const { service, prisma } = buildService();
    prisma.transaction.findMany.mockResolvedValue([{ id: 'txn-a' }]);

    await expect(
      service.bulkDeleteTransactions('admin-1', 'user-1', {
        transactionIds: ['txn-a', 'txn-not-owned'],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an empty request', async () => {
    const { service } = buildService();
    await expect(service.bulkDeleteTransactions('admin-1', 'user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
