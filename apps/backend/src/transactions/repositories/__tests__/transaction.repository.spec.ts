import { Decimal } from '@prisma/client/runtime/library';
import { TransactionRepository, type TransactionRecord } from '../transaction.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionType } from '../../enums/transaction-type.enum';
import { TransactionStatus } from '../../enums/transaction-status.enum';

const SOURCE_UUID = '11111111-1111-4111-8111-111111111111';
const DEST_UUID = '22222222-2222-4222-8222-222222222222';
const TXN_UUID = '33333333-3333-4333-8333-333333333333';

type LineCreate = { data: { entryType: string; accountCode: string; amount: Decimal } };
type AccountUpdate = { where: { id: string }; data: { currentBalance: Decimal; availableBalance: Decimal } };

/**
 * A minimal Prisma double for applyBalanceMutation. It records the writes so we
 * can assert on them. Crucially it lets us verify that TransactionLine.accountCode
 * is the account NUMBER (<=20 chars) and not the 36-char account UUID — the real
 * VARCHAR(20) column would reject the UUID and roll the whole transfer back.
 */
function buildPrismaDouble() {
  const accounts = new Map<string, { id: string; accountNumber: string; currentBalance: Decimal; availableBalance: Decimal; holdAmount: Decimal }>([
    [SOURCE_UUID, { id: SOURCE_UUID, accountNumber: '000100200300', currentBalance: new Decimal('100.00'), availableBalance: new Decimal('100.00'), holdAmount: new Decimal('0') }],
    [DEST_UUID, { id: DEST_UUID, accountNumber: '000900800700', currentBalance: new Decimal('5.00'), availableBalance: new Decimal('5.00'), holdAmount: new Decimal('0') }],
  ]);

  const lineCreates: LineCreate[] = [];
  const accountUpdates: AccountUpdate[] = [];

  const tx = {
    transaction: {
      findUnique: jest.fn().mockResolvedValue({ id: TXN_UUID, metadata: {} }),
      update: jest.fn().mockResolvedValue({}),
    },
    bankAccount: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => Promise.resolve(accounts.get(where.id) ?? null)),
      update: jest.fn((args: AccountUpdate) => {
        accountUpdates.push(args);
        const account = accounts.get(args.where.id);
        if (account) {
          account.currentBalance = args.data.currentBalance;
          account.availableBalance = args.data.availableBalance;
        }
        return Promise.resolve({});
      }),
    },
    balanceSnapshot: { create: jest.fn().mockResolvedValue({}) },
    transactionLine: {
      create: jest.fn((args: LineCreate) => {
        lineCreates.push(args);
        return Promise.resolve({});
      }),
    },
  };

  const prisma = {
    $transaction: jest.fn((cb: (client: typeof tx) => Promise<unknown>) => cb(tx)),
  } as unknown as PrismaService;

  return { prisma, lineCreates, accountUpdates, accounts };
}

function baseRecord(overrides: Partial<TransactionRecord>): TransactionRecord {
  const now = new Date();
  return {
    id: TXN_UUID,
    reference: 'TXN-1',
    type: TransactionType.ACH_DEBIT,
    status: TransactionStatus.PENDING,
    accountId: SOURCE_UUID,
    amount: '10.00',
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('TransactionRepository.applyBalanceMutation', () => {
  it('writes the account NUMBER (<=20 chars) into accountCode, never the account UUID', async () => {
    const { prisma, lineCreates } = buildPrismaDouble();
    const repository = new TransactionRepository(prisma);

    await repository.applyBalanceMutation(baseRecord({ type: TransactionType.ACH_DEBIT }));

    expect(lineCreates).toHaveLength(1);
    const line = lineCreates[0]!;
    expect(line.data.entryType).toBe('DEBIT');
    // Regression guard for the production failure: TransactionLine.accountCode is
    // VARCHAR(20); a 36-char UUID overflows it and rolls back the whole transfer.
    expect(line.data.accountCode).toBe('000100200300');
    expect(line.data.accountCode).not.toBe(SOURCE_UUID);
    expect(line.data.accountCode.length).toBeLessThanOrEqual(20);
  });

  it('debits BOTH current and available balance on a debit transaction', async () => {
    const { prisma, accountUpdates, accounts } = buildPrismaDouble();
    const repository = new TransactionRepository(prisma);

    await repository.applyBalanceMutation(baseRecord({ type: TransactionType.ACH_DEBIT, amount: '10.00' }));

    const source = accounts.get(SOURCE_UUID)!;
    expect(source.currentBalance.toFixed(2)).toBe('90.00');
    expect(source.availableBalance.toFixed(2)).toBe('90.00');
    expect(accountUpdates).toHaveLength(1);
  });

  it('an internal transfer debits the source and credits the destination with account numbers', async () => {
    const { prisma, lineCreates, accounts } = buildPrismaDouble();
    const repository = new TransactionRepository(prisma);

    await repository.applyBalanceMutation(
      baseRecord({ type: TransactionType.INTERNAL_TRANSFER, counterpartyAccountId: DEST_UUID, amount: '10.00' }),
    );

    expect(lineCreates).toHaveLength(2);
    for (const line of lineCreates) {
      expect(line.data.accountCode.length).toBeLessThanOrEqual(20);
      expect([SOURCE_UUID, DEST_UUID]).not.toContain(line.data.accountCode);
    }
    expect(accounts.get(SOURCE_UUID)!.currentBalance.toFixed(2)).toBe('90.00');
    expect(accounts.get(DEST_UUID)!.currentBalance.toFixed(2)).toBe('15.00');
  });
});
