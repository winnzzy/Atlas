import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma} from '@prisma/client';
import { TransactionStatus as PrismaTransactionStatus, TransactionType as PrismaTransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { CREDIT_TRANSACTION_TYPES, DEBIT_TRANSACTION_TYPES, TransactionType, TRANSFER_TRANSACTION_TYPES } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export interface TransactionRecord {
  id: string;
  reference: string;
  idempotencyKey?: string;
  type: string;
  status: string;
  accountId: string;
  amount: string;
  currency: string;
  description?: string;
  counterpartyAccountId?: string;
  metadata?: Record<string, string>;
  journalId?: string;
  failureReason?: string;
  failureCode?: string;
  reversalId?: string;
  reversalOfId?: string;
  createdBy?: string;
  authorizedBy?: string;
  postedBy?: string;
  settledBy?: string;
  createdAt: Date;
  updatedAt: Date;
  authorizedAt?: Date;
  postedAt?: Date;
  settledAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  reversedAt?: Date;
  expiresAt?: Date;
}

export interface TransactionSearchParams {
  reference?: string;
  idempotencyKey?: string;
  type?: string;
  status?: string;
  accountId?: string;
  counterpartyAccountId?: string;
  currency?: string;
  minAmount?: string;
  maxAmount?: string;
  createdFrom?: Date;
  createdTo?: Date;
  createdBy?: string;
  limit: number;
  cursor?: string;
}

export interface TransactionSearchResult {
  items: TransactionRecord[];
  nextCursor?: string;
  totalCount: number;
}

type TransactionMetadata = Record<string, unknown> & {
  domainType?: string;
  domainStatus?: string;
  idempotencyKey?: string;
  counterpartyAccountId?: string;
  journalId?: string;
  failureReason?: string;
  failureCode?: string;
  reversalId?: string;
  reversalOfId?: string;
  authorizedBy?: string;
  postedBy?: string;
  settledBy?: string;
  authorizedAt?: string;
  postedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  reversedAt?: string;
  expiresAt?: string;
  balanceApplied?: boolean;
};
type TransactionRow = Prisma.TransactionGetPayload<Record<string, never>>;

@Injectable()
export class TransactionRepository {
  private readonly logger = new Logger(TransactionRepository.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TransactionRecord | null> {
    const transaction = await this.prisma.transaction.findFirst({ where: { id, deletedAt: null } });
    return transaction ? this.toRecord(transaction) : null;
  }

  async findByReference(reference: string): Promise<TransactionRecord | null> {
    const transaction = await this.prisma.transaction.findFirst({ where: { reference, deletedAt: null } });
    return transaction ? this.toRecord(transaction) : null;
  }

  async findByIdempotencyKey(key: string): Promise<TransactionRecord | null> {
    const transactions = await this.prisma.transaction.findMany({ where: { deletedAt: null } });
    const found = transactions.find((transaction) => this.metadata(transaction.metadata).idempotencyKey === key);
    return found ? this.toRecord(found) : null;
  }

  async save(record: TransactionRecord): Promise<TransactionRecord> {
    await this.prisma.transaction.create({
      data: {
        id: record.id,
        accountId: record.accountId,
        type: this.toPrismaType(record.type),
        status: this.toPrismaStatus(record.status),
        amount: new Decimal(record.amount),
        currency: record.currency,
        description: record.description,
        reference: record.reference,
        metadata: this.toMetadata(record) as Prisma.InputJsonValue,
        createdBy: this.uuidOrUndefined(record.createdBy),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
    return record;
  }

  async update(record: TransactionRecord): Promise<TransactionRecord> {
    await this.prisma.transaction.update({
      where: { id: record.id },
      data: {
        type: this.toPrismaType(record.type),
        status: this.toPrismaStatus(record.status),
        amount: new Decimal(record.amount),
        currency: record.currency,
        description: record.description,
        reference: record.reference,
        metadata: this.toMetadata(record) as Prisma.InputJsonValue,
        settledAt: record.settledAt ?? record.completedAt,
        updatedBy: this.uuidOrUndefined(record.settledBy ?? record.postedBy ?? record.authorizedBy),
      },
    });
    return { ...record, updatedAt: new Date() };
  }

  async applyBalanceMutation(record: TransactionRecord): Promise<void> {
    const amount = new Decimal(record.amount);
    if (amount.lte(0)) {
      throw new Error('Transaction amount must be positive');
    }

    await this.prisma.$transaction(async (tx) => {
      const persisted = await tx.transaction.findUnique({ where: { id: record.id } });
      if (!persisted) {
        throw new Error(`Transaction ${record.id} not found`);
      }

      const existingMetadata = this.metadata(persisted.metadata);
      if (existingMetadata.balanceApplied === true) {
        return;
      }

      const source = await tx.bankAccount.findUnique({ where: { id: record.accountId } });
      if (!source) {
        throw new Error(`Account ${record.accountId} not found`);
      }

      if (TRANSFER_TRANSACTION_TYPES.has(record.type as TransactionType)) {
        if (!record.counterpartyAccountId) {
          throw new Error('Internal transfer requires a counterparty account');
        }

        const destination = await tx.bankAccount.findUnique({ where: { id: record.counterpartyAccountId } });
        if (!destination) {
          throw new Error(`Destination account ${record.counterpartyAccountId} not found`);
        }

        await this.applyAccountDelta(tx, record.id, source.id, amount.negated());
        await this.applyAccountDelta(tx, record.id, destination.id, amount);
        await this.createTransactionLine(tx, record.id, 'DEBIT', source.accountNumber, amount, `Transfer out ${record.reference}`);
        await this.createTransactionLine(tx, record.id, 'CREDIT', destination.accountNumber, amount, `Transfer in ${record.reference}`);
      } else if (DEBIT_TRANSACTION_TYPES.has(record.type as TransactionType)) {
        await this.applyAccountDelta(tx, record.id, source.id, amount.negated());
        await this.createTransactionLine(tx, record.id, 'DEBIT', source.accountNumber, amount, record.description ?? record.type);
      } else if (CREDIT_TRANSACTION_TYPES.has(record.type as TransactionType) || record.type === TransactionType.ADJUSTMENT) {
        await this.applyAccountDelta(tx, record.id, source.id, amount);
        await this.createTransactionLine(tx, record.id, 'CREDIT', source.accountNumber, amount, record.description ?? record.type);
      }

      await tx.transaction.update({
        where: { id: record.id },
        data: {
          metadata: {
            ...existingMetadata,
            ...this.toMetadata(record),
            balanceApplied: true,
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  async search(params: TransactionSearchParams): Promise<TransactionSearchResult> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (params.reference) where.reference = params.reference;
    if (params.currency) where.currency = params.currency;
    if (params.accountId) where.accountId = params.accountId;
    if (params.createdBy) where.createdBy = params.createdBy;
    if (params.createdFrom || params.createdTo) {
      where.createdAt = {
        gte: params.createdFrom,
        lte: params.createdTo,
      };
    }
    if (params.minAmount || params.maxAmount) {
      where.amount = {
        gte: params.minAmount ? new Decimal(params.minAmount) : undefined,
        lte: params.maxAmount ? new Decimal(params.maxAmount) : undefined,
      };
    }

    const [rows, totalCount] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: params.cursor ? 1 : 0,
        cursor: params.cursor ? { id: params.cursor } : undefined,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const filtered = rows
      .map((row) => this.toRecord(row))
      .filter((row) => !params.type || row.type === params.type)
      .filter((row) => !params.status || row.status === params.status)
      .filter((row) => !params.idempotencyKey || row.idempotencyKey === params.idempotencyKey)
      .filter((row) => !params.counterpartyAccountId || row.counterpartyAccountId === params.counterpartyAccountId);

    const lastItem = filtered.at(-1);
    return {
      items: filtered,
      nextCursor: filtered.length === params.limit && lastItem ? lastItem.id : undefined,
      totalCount,
    };
  }

  async findByAccount(accountId: string, limit: number, cursor?: string): Promise<TransactionSearchResult> {
    const direct = await this.search({ accountId, limit, cursor });
    const all = await this.prisma.transaction.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
    const counterparty = all
      .map((row) => this.toRecord(row))
      .filter((row) => row.counterpartyAccountId === accountId);

    const merged = [...direct.items, ...counterparty]
      .filter((row, index, rows) => rows.findIndex((item) => item.id === row.id) === index)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);

    const lastItem = merged.at(-1);
    return {
      items: merged,
      nextCursor: merged.length === limit && lastItem ? lastItem.id : undefined,
      totalCount: merged.length,
    };
  }

  /**
   * Soft-delete a transaction so it disappears from every admin view/history
   * (all reads filter `deletedAt: null`). This never touches balances, ledger
   * journals, or balance snapshots — it only hides the record.
   */
  async softDelete(id: string, deletedBy?: string): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: this.uuidOrUndefined(deletedBy),
      },
    });
  }

  async existsByReference(reference: string): Promise<boolean> {
    return (await this.prisma.transaction.count({ where: { reference, deletedAt: null } })) > 0;
  }

  async existsByIdempotencyKey(key: string): Promise<boolean> {
    return (await this.findByIdempotencyKey(key)) !== null;
  }

  async countByAccountAndDateRange(accountId: string, from: Date, to: Date): Promise<number> {
    return this.prisma.transaction.count({
      where: { accountId, createdAt: { gte: from, lte: to }, deletedAt: null },
    });
  }

  async sumAmountByAccountAndDateRange(accountId: string, from: Date, to: Date, type?: string): Promise<string> {
    const transactions = await this.findByAccountAndDateRange(accountId, from, to);
    const total = transactions
      .filter((transaction) => !type || transaction.type === type)
      .reduce((sum, transaction) => sum.plus(transaction.amount), new Decimal(0));
    return total.toFixed(2);
  }

  async findByAccountAndDateRange(accountId: string, from: Date, to: Date): Promise<TransactionRecord[]> {
    const rows = await this.prisma.transaction.findMany({
      where: { accountId, createdAt: { gte: from, lte: to }, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toRecord(row));
  }

  private async applyAccountDelta(tx: Prisma.TransactionClient, transactionId: string, accountId: string, delta: Decimal): Promise<void> {
    const account = await tx.bankAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const previous = new Decimal(account.currentBalance);
    const next = previous.plus(delta);
    const holdAmount = new Decimal(account.holdAmount ?? 0);

    await tx.bankAccount.update({
      where: { id: accountId },
      data: {
        currentBalance: next,
        availableBalance: next.minus(holdAmount),
      },
    });

    await tx.balanceSnapshot.create({
      data: {
        accountId,
        transactionId,
        previousBalance: previous,
        newBalance: next,
        changeAmount: delta,
      },
    });
  }

  // `accountCode` is TransactionLine.accountCode, a VARCHAR(20) column. Callers must
  // pass the account NUMBER (<=20 chars), never the 36-char account UUID — a UUID
  // overflows the column and rolls back the whole balance-mutation transaction.
  private async createTransactionLine(
    tx: Prisma.TransactionClient,
    transactionId: string,
    entryType: 'DEBIT' | 'CREDIT',
    accountCode: string,
    amount: Decimal,
    description: string,
  ): Promise<void> {
    await tx.transactionLine.create({
      data: {
        transactionId,
        entryType,
        accountCode,
        accountName: accountCode,
        amount,
        description,
      },
    });
  }

  private toRecord(row: TransactionRow): TransactionRecord {
    const metadata = this.metadata(row.metadata);
    return {
      id: row.id,
      reference: row.reference ?? row.id,
      idempotencyKey: this.asString(metadata.idempotencyKey),
      type: this.asString(metadata.domainType) ?? this.fromPrismaType(row.type),
      status: this.asString(metadata.domainStatus) ?? this.fromPrismaStatus(row.status),
      accountId: row.accountId,
      amount: new Decimal(row.amount).toFixed(2),
      currency: row.currency,
      description: row.description ?? undefined,
      counterpartyAccountId: this.asString(metadata.counterpartyAccountId),
      metadata: this.cleanUserMetadata(metadata),
      journalId: this.asString(metadata.journalId),
      failureReason: row.status === PrismaTransactionStatus.FAILED ? row.description ?? undefined : this.asString(metadata.failureReason),
      failureCode: this.asString(metadata.failureCode),
      reversalId: this.asString(metadata.reversalId),
      reversalOfId: this.asString(metadata.reversalOfId),
      createdBy: row.createdBy ?? undefined,
      authorizedBy: this.asString(metadata.authorizedBy),
      postedBy: this.asString(metadata.postedBy),
      settledBy: this.asString(metadata.settledBy),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      authorizedAt: this.asDate(metadata.authorizedAt),
      postedAt: this.asDate(metadata.postedAt),
      settledAt: row.settledAt ?? undefined,
      completedAt: row.status === PrismaTransactionStatus.COMPLETED ? row.settledAt ?? row.updatedAt : undefined,
      failedAt: this.asDate(metadata.failedAt),
      cancelledAt: this.asDate(metadata.cancelledAt),
      reversedAt: this.asDate(metadata.reversedAt),
      expiresAt: this.asDate(metadata.expiresAt),
    };
  }

  private toMetadata(record: TransactionRecord): TransactionMetadata {
    return {
      ...(record.metadata ?? {}),
      domainType: record.type,
      domainStatus: record.status,
      idempotencyKey: record.idempotencyKey,
      counterpartyAccountId: record.counterpartyAccountId,
      journalId: record.journalId,
      failureReason: record.failureReason,
      failureCode: record.failureCode,
      reversalId: record.reversalId,
      reversalOfId: record.reversalOfId,
      authorizedBy: record.authorizedBy,
      postedBy: record.postedBy,
      settledBy: record.settledBy,
      authorizedAt: record.authorizedAt?.toISOString(),
      postedAt: record.postedAt?.toISOString(),
      failedAt: record.failedAt?.toISOString(),
      cancelledAt: record.cancelledAt?.toISOString(),
      reversedAt: record.reversedAt?.toISOString(),
      expiresAt: record.expiresAt?.toISOString(),
    };
  }

  private metadata(value: unknown): TransactionMetadata {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as TransactionMetadata : {};
  }

  private cleanUserMetadata(metadata: TransactionMetadata): Record<string, string> | undefined {
    const internal = new Set([
      'domainType',
      'domainStatus',
      'idempotencyKey',
      'counterpartyAccountId',
      'journalId',
      'failureReason',
      'failureCode',
      'reversalId',
      'reversalOfId',
      'authorizedBy',
      'postedBy',
      'settledBy',
      'authorizedAt',
      'postedAt',
      'failedAt',
      'cancelledAt',
      'reversedAt',
      'expiresAt',
      'balanceApplied',
    ]);
    const entries = Object.entries(metadata)
      .filter(([key, value]) => !internal.has(key) && typeof value === 'string') as Array<[string, string]>;
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  private toPrismaType(type: string): PrismaTransactionType {
    if (type === TransactionType.INTERNAL_TRANSFER) return PrismaTransactionType.TRANSFER_OUT;
    if (type === TransactionType.ACH_CREDIT) return PrismaTransactionType.ACH_DEPOSIT;
    if (type === TransactionType.ACH_DEBIT) return PrismaTransactionType.ACH_WITHDRAWAL;
    if (type === TransactionType.WIRE_DOMESTIC || type === TransactionType.WIRE_INTERNATIONAL || type === TransactionType.SWIFT) {
      return PrismaTransactionType.WIRE_OUTGOING;
    }
    if (type === TransactionType.CARD_PURCHASE || type === TransactionType.CARD_AUTHORIZATION || type === TransactionType.CARD_CAPTURE) {
      return PrismaTransactionType.CARD_PURCHASE;
    }
    if (type === TransactionType.PAYROLL_DEPOSIT) return PrismaTransactionType.DEPOSIT;
    if (type === TransactionType.INTEREST_CREDIT) return PrismaTransactionType.INTEREST;
    if (type === TransactionType.REVERSAL) return PrismaTransactionType.ADJUSTMENT;
    return Object.values(PrismaTransactionType).includes(type as PrismaTransactionType)
      ? type as PrismaTransactionType
      : PrismaTransactionType.ADJUSTMENT;
  }

  private fromPrismaType(type: PrismaTransactionType): string {
    if (type === PrismaTransactionType.TRANSFER_OUT) return TransactionType.INTERNAL_TRANSFER;
    if (type === PrismaTransactionType.ACH_DEPOSIT) return TransactionType.ACH_CREDIT;
    if (type === PrismaTransactionType.ACH_WITHDRAWAL) return TransactionType.ACH_DEBIT;
    if (type === PrismaTransactionType.WIRE_OUTGOING) return TransactionType.WIRE_DOMESTIC;
    return type;
  }

  private toPrismaStatus(status: string): PrismaTransactionStatus {
    if (status === TransactionStatus.COMPLETED || status === TransactionStatus.SETTLED || status === TransactionStatus.POSTED) {
      return PrismaTransactionStatus.COMPLETED;
    }
    if (status === TransactionStatus.FAILED) return PrismaTransactionStatus.FAILED;
    if (status === TransactionStatus.CANCELLED) return PrismaTransactionStatus.CANCELLED;
    if (status === TransactionStatus.REVERSED) return PrismaTransactionStatus.REVERSED;
    if (status === TransactionStatus.AUTHORIZED || status === TransactionStatus.VALIDATED) return PrismaTransactionStatus.PROCESSING;
    return PrismaTransactionStatus.PENDING;
  }

  private fromPrismaStatus(status: PrismaTransactionStatus): string {
    if (status === PrismaTransactionStatus.COMPLETED) return TransactionStatus.COMPLETED;
    if (status === PrismaTransactionStatus.FAILED) return TransactionStatus.FAILED;
    if (status === PrismaTransactionStatus.CANCELLED) return TransactionStatus.CANCELLED;
    if (status === PrismaTransactionStatus.REVERSED) return TransactionStatus.REVERSED;
    if (status === PrismaTransactionStatus.PROCESSING) return TransactionStatus.AUTHORIZED;
    return TransactionStatus.PENDING;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private asDate(value: unknown): Date | undefined {
    return typeof value === 'string' ? new Date(value) : undefined;
  }

  private uuidOrUndefined(value: string | undefined): string | undefined {
    return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      ? value
      : undefined;
  }
}
