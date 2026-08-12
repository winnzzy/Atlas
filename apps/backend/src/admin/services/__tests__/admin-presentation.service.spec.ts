import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaService } from '../../../prisma/prisma.service';
import { AdminPolicy } from '../../policies/admin.policy';
import { AdminPresentationService } from '../admin-presentation.service';

type Row = Record<string, any>;

function buildPrisma(options: { account?: Row | null; holder?: Row | null; user?: Row | null } = {}) {
  const account: Row | null = options.account === undefined
    ? {
        id: 'acc-1',
        accountNumber: '0000012345',
        name: 'Everyday Checking',
        currency: 'USD',
        status: 'ACTIVE',
        currentBalance: new Decimal(0),
        availableBalance: new Decimal(0),
        holdAmount: new Decimal(0),
        deletedAt: null,
      }
    : options.account;

  const user = options.user === undefined ? { id: 'user-1', deletedAt: null } : options.user;
  const holder = options.holder === undefined ? { userId: 'user-1', accountId: 'acc-1' } : options.holder;

  const transactions: Row[] = [];
  const lines: Row[] = [];
  const snapshots: Row[] = [];

  const isPresentationFilter = (where: Row | undefined) =>
    where?.metadata?.path?.[0] === 'presentation' && where?.metadata?.equals === true;

  const client: Row = {
    user: {
      findFirst: jest.fn(async () => user),
    },
    bankAccount: {
      findFirst: jest.fn(async () => (account ? { ...account } : null)),
      update: jest.fn(async ({ data }: Row) => {
        if (account) {
          account.currentBalance = data.currentBalance;
          account.availableBalance = data.availableBalance;
        }
        return { ...account };
      }),
    },
    accountHolder: {
      findFirst: jest.fn(async () => holder),
    },
    transaction: {
      count: jest.fn(async () => transactions.length),
      findMany: jest.fn(async ({ where }: Row = {}) => {
        if (isPresentationFilter(where)) {
          return transactions.filter((t) => t.metadata?.presentation === true).map((t) => ({ ...t }));
        }
        return transactions.map((t) => ({ ...t }));
      }),
      create: jest.fn(async ({ data }: Row) => {
        transactions.push({ ...data });
        return { ...data };
      }),
      deleteMany: jest.fn(async ({ where }: Row) => {
        const ids: string[] = where?.id?.in ?? [];
        for (let i = transactions.length - 1; i >= 0; i -= 1) {
          if (ids.includes(transactions[i]?.id)) transactions.splice(i, 1);
        }
        for (let i = snapshots.length - 1; i >= 0; i -= 1) {
          if (ids.includes(snapshots[i]?.transactionId)) snapshots.splice(i, 1);
        }
        return { count: ids.length };
      }),
    },
    transactionLine: {
      create: jest.fn(async ({ data }: Row) => {
        lines.push({ ...data });
        return { ...data };
      }),
    },
    balanceSnapshot: {
      create: jest.fn(async ({ data }: Row) => {
        snapshots.push({ ...data });
        return { ...data };
      }),
      aggregate: jest.fn(async ({ where }: Row) => {
        const ids: string[] = where?.transactionId?.in ?? [];
        const sum = snapshots
          .filter((s) => ids.includes(s.transactionId))
          .reduce((acc, s) => acc.plus(new Decimal(s.changeAmount)), new Decimal(0));
        return { _sum: { changeAmount: sum } };
      }),
      findFirst: jest.fn(async ({ where }: Row) => {
        return snapshots.find((s) => s.transactionId === where?.transactionId) ?? null;
      }),
    },
    $transaction: jest.fn(async (cb: (tx: Row) => unknown) => cb(client)),
    __state: { account, transactions, lines, snapshots },
  };

  return client;
}

function makeService(prisma: Row) {
  return new AdminPresentationService(prisma as unknown as PrismaService);
}

describe('AdminPresentationService', () => {
  it('generates six months of activity that closes exactly at the target balance', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    const result = await service.generate('user-1', { accountId: 'acc-1' });

    // (7) Final balance equals exactly 4,700,000.00
    expect(result.finalBalance).toBe('4700000.00');
    // (6) Records persisted through the transaction/ledger tables
    expect(prisma.transaction.create).toHaveBeenCalledTimes(result.transactionCount);
    expect(prisma.transactionLine.create).toHaveBeenCalledTimes(result.transactionCount);
    expect(prisma.balanceSnapshot.create).toHaveBeenCalledTimes(result.transactionCount);
    expect(result.transactionCount).toBeGreaterThan(20);

    // (8) Ledger and account balance reconcile
    const account = prisma.__state.account;
    expect(new Decimal(account.currentBalance).toFixed(2)).toBe('4700000.00');
    const snapshotSum = prisma.__state.snapshots.reduce(
      (acc: Decimal, s: Row) => acc.plus(new Decimal(s.changeAmount)),
      new Decimal(0),
    );
    expect(snapshotSum.toFixed(2)).toBe('4700000.00');
  });

  it('writes the account number (not the UUID) as the ledger line account code', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    await service.generate('user-1', { accountId: 'acc-1' });

    const account = prisma.__state.account;
    expect(prisma.__state.lines.length).toBeGreaterThan(20);
    for (const line of prisma.__state.lines) {
      // Regression guard: accountCode must be the account number, never the UUID.
      // TransactionLine.accountCode is VARCHAR(20); a 36-char UUID overflows it in
      // PostgreSQL and 500s the whole generation.
      expect(line.accountCode).toBe(account.accountNumber);
      expect(line.accountCode).not.toBe(account.id);
      expect(line.accountCode.length).toBeLessThanOrEqual(20);
    }
  });

  it('spreads the generated history across roughly six months ending now', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    await service.generate('user-1', { accountId: 'acc-1' });

    const dates = prisma.__state.transactions.map((t: Row) => new Date(t.createdAt).getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    const spanDays = (max - min) / (24 * 60 * 60 * 1000);
    // (5) ~six months of history, not all on the same timestamp.
    expect(spanDays).toBeGreaterThan(150);
    expect(spanDays).toBeLessThan(195);
    expect(new Set(dates).size).toBeGreaterThan(20);
    expect(max).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('marks generated rows internally without exposing the marker as a plain string', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    await service.generate('user-1', { accountId: 'acc-1' });

    for (const txn of prisma.__state.transactions) {
      expect(txn.metadata.presentation).toBe(true);
      expect(typeof txn.metadata.presentationMeta).toBe('object');
    }
  });

  it('rejects generation when the target customer does not exist', async () => {
    const prisma = buildPrisma({ user: null });
    const service = makeService(prisma);
    await expect(service.generate('user-x', { accountId: 'acc-1' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects generation when the account does not belong to the customer', async () => {
    const prisma = buildPrisma({ holder: null });
    const service = makeService(prisma);
    await expect(service.generate('user-1', { accountId: 'acc-1' })).rejects.toBeInstanceOf(ForbiddenException);
    // No money moved.
    expect(prisma.transaction.create).not.toHaveBeenCalled();
    expect(prisma.bankAccount.update).not.toHaveBeenCalled();
  });

  it('prevents accidental duplicate generation unless replace is requested', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    await service.generate('user-1', { accountId: 'acc-1' });
    const firstCount = prisma.__state.transactions.length;

    // Second run without replace is blocked.
    await expect(service.generate('user-1', { accountId: 'acc-1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.__state.transactions.length).toBe(firstCount);

    // Replace regenerates atomically and still closes at the target.
    const replaced = await service.generate('user-1', { accountId: 'acc-1', replace: true });
    expect(replaced.replaced).toBe(true);
    expect(replaced.finalBalance).toBe('4700000.00');
    expect(new Decimal(prisma.__state.account.currentBalance).toFixed(2)).toBe('4700000.00');
  });

  it('rolls the whole operation back if a write fails mid-way (atomicity)', async () => {
    const prisma = buildPrisma();
    // Fail on the third snapshot write to simulate a mid-generation failure.
    let calls = 0;
    prisma.balanceSnapshot.create.mockImplementation(async () => {
      calls += 1;
      if (calls === 3) throw new Error('simulated db failure');
      return {};
    });
    const service = makeService(prisma);

    await expect(service.generate('user-1', { accountId: 'acc-1' })).rejects.toThrow(/simulated db failure/);
    // The account balance was never committed to the target.
    expect(new Decimal(prisma.__state.account.currentBalance).toFixed(2)).toBe('0.00');
  });

  it('reports presentation status for the admin view', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    expect((await service.getStatus('user-1', 'acc-1')).presentationExists).toBe(false);
    await service.generate('user-1', { accountId: 'acc-1' });
    const status = await service.getStatus('user-1', 'acc-1');
    expect(status.presentationExists).toBe(true);
    expect(status.presentationCount).toBeGreaterThan(20);
    expect(status.currentBalance).toBe('4700000.00');
  });
});

describe('presentation authorization', () => {
  const policy = new AdminPolicy();

  it('allows FINANCE and above to run the generator', () => {
    expect(() => policy.assertAllowed('FINANCE', 'transaction.manage')).not.toThrow();
    expect(() => policy.assertAllowed('ADMIN', 'transaction.manage')).not.toThrow();
    expect(() => policy.assertAllowed('SUPER_ADMIN', 'transaction.manage')).not.toThrow();
  });

  it('blocks lower-privileged roles from running the generator', () => {
    expect(() => policy.assertAllowed('SUPPORT', 'transaction.manage')).toThrow(ForbiddenException);
    expect(() => policy.assertAllowed('OPERATIONS', 'transaction.manage')).toThrow(ForbiddenException);
  });
});
