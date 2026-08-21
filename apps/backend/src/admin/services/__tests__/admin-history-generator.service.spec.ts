import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaService } from '../../../prisma/prisma.service';
import { AdminHistoryGeneratorService } from '../admin-history-generator.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function buildPrisma(
  options: { account?: Row | null; holder?: Row | null; user?: Row | null } = {},
) {
  const account: Row | null =
    options.account === undefined
      ? {
          id: 'acc-1',
          accountNumber: '0000012345',
          name: 'Everyday Checking',
          currency: 'USD',
          status: 'ACTIVE',
          currentBalance: new Decimal(4_700_000),
          availableBalance: new Decimal(4_700_000),
          holdAmount: new Decimal(0),
          deletedAt: null,
        }
      : options.account;

  const user = options.user === undefined ? { id: 'user-1', deletedAt: null } : options.user;
  const holder =
    options.holder === undefined ? { userId: 'user-1', accountId: 'acc-1' } : options.holder;

  const transactions: Row[] = [];
  const lines: Row[] = [];
  const snapshots: Row[] = [];

  const client: Row = {
    user: { findFirst: jest.fn(async () => user) },
    bankAccount: {
      findFirst: jest.fn(async () => (account ? { ...account } : null)),
      update: jest.fn(),
    },
    accountHolder: { findFirst: jest.fn(async () => holder) },
    transaction: {
      create: jest.fn(async ({ data }: Row) => {
        transactions.push({ ...data });
        return { ...data };
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
    },
    $transaction: jest.fn(async (cb: (tx: Row) => unknown) => cb(client)),
    __state: { account, transactions, lines, snapshots },
  };

  return client;
}

function makeService(prisma: Row) {
  return new AdminHistoryGeneratorService(prisma as unknown as PrismaService);
}

describe('AdminHistoryGeneratorService', () => {
  it('generates realistic history without ever writing to the account balance', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    const result = await service.generateHistory('user-1', 'acc-1', {});

    expect(result.transactionCount).toBeGreaterThan(0);
    expect(prisma.transaction.create).toHaveBeenCalledTimes(result.transactionCount);
    expect(prisma.transactionLine.create).toHaveBeenCalledTimes(result.transactionCount);
    expect(prisma.balanceSnapshot.create).toHaveBeenCalledTimes(result.transactionCount);
    // The live balance is never touched — no bankAccount.update call at all.
    expect(prisma.bankAccount.update).not.toHaveBeenCalled();
  });

  it('nets every batch to exactly zero (credits equal debits)', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    const result = await service.generateHistory('user-1', 'acc-1', { months: 3 });

    expect(new Decimal(result.totalCredits).minus(result.totalDebits).toFixed(2)).toBe('0.00');

    const snapshotSum = prisma.__state.snapshots.reduce(
      (acc: Decimal, s: Row) => acc.plus(new Decimal(s.changeAmount)),
      new Decimal(0),
    );
    expect(snapshotSum.toFixed(2)).toBe('0.00');
  });

  it('posts every generated row as COMPLETED and backdates it within the requested window', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    await service.generateHistory('user-1', 'acc-1', { months: 2 });

    for (const txn of prisma.__state.transactions) {
      expect(txn.status).toBe('COMPLETED');
      expect(txn.metadata.generatedHistory).toBe(true);
    }
    const dates = prisma.__state.transactions.map((t: Row) => new Date(t.createdAt).getTime());
    expect(Math.max(...dates)).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('scales toward the requested total volume when totalAmount is given', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    const result = await service.generateHistory('user-1', 'acc-1', {
      months: 2,
      totalAmount: '10000',
    });

    const volume = new Decimal(result.totalCredits).plus(result.totalDebits).toNumber();
    // Not exact (a balancing entry is added), but should land in the right order of magnitude.
    expect(volume).toBeGreaterThan(5000);
    expect(volume).toBeLessThan(20000);
  });

  it('writes the account number (not the UUID) as the ledger line account code', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);

    await service.generateHistory('user-1', 'acc-1', {});

    const account = prisma.__state.account;
    for (const line of prisma.__state.lines) {
      expect(line.accountCode).toBe(account.accountNumber);
      expect(line.accountCode.length).toBeLessThanOrEqual(20);
    }
  });

  it('rejects when the target customer does not exist', async () => {
    const prisma = buildPrisma({ user: null });
    const service = makeService(prisma);
    await expect(service.generateHistory('user-x', 'acc-1', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects when the account does not belong to the customer', async () => {
    const prisma = buildPrisma({ holder: null });
    const service = makeService(prisma);
    await expect(service.generateHistory('user-1', 'acc-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('rejects a non-positive totalAmount', async () => {
    const prisma = buildPrisma();
    const service = makeService(prisma);
    await expect(
      service.generateHistory('user-1', 'acc-1', { totalAmount: '0' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
