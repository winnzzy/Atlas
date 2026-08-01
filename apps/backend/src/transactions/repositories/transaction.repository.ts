import { Injectable, Logger } from '@nestjs/common';

/**
 * Transaction Entity - represents a stored transaction record.
 * This is the internal domain representation, not the API DTO.
 */
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

@Injectable()
export class TransactionRepository {
  private readonly logger = new Logger(TransactionRepository.name);

  /**
   * In-memory storage. In production this would be replaced by Prisma/DB.
   * The interface is designed for easy swap to a real database implementation.
   */
  private readonly transactions = new Map<string, TransactionRecord>();
  private readonly referenceIndex = new Map<string, string>();
  private readonly idempotencyIndex = new Map<string, string>();

  async findById(id: string): Promise<TransactionRecord | null> {
    return this.transactions.get(id) ?? null;
  }

  async findByReference(reference: string): Promise<TransactionRecord | null> {
    const id = this.referenceIndex.get(reference);
    if (!id) return null;
    return this.transactions.get(id) ?? null;
  }

  async findByIdempotencyKey(key: string): Promise<TransactionRecord | null> {
    const id = this.idempotencyIndex.get(key);
    if (!id) return null;
    return this.transactions.get(id) ?? null;
  }

  async save(record: TransactionRecord): Promise<TransactionRecord> {
    this.transactions.set(record.id, { ...record });
    this.referenceIndex.set(record.reference, record.id);
    if (record.idempotencyKey) {
      this.idempotencyIndex.set(record.idempotencyKey, record.id);
    }
    return record;
  }

  async update(record: TransactionRecord): Promise<TransactionRecord> {
    const existing = this.transactions.get(record.id);
    if (!existing) {
      throw new Error(`Transaction ${record.id} not found for update`);
    }
    const updated = { ...record, updatedAt: new Date() };
    this.transactions.set(record.id, updated);
    return updated;
  }

  async search(params: TransactionSearchParams): Promise<TransactionSearchResult> {
    let items = Array.from(this.transactions.values());

    if (params.reference) {
      items = items.filter((t) => t.reference === params.reference);
    }
    if (params.type) {
      items = items.filter((t) => t.type === params.type);
    }
    if (params.status) {
      items = items.filter((t) => t.status === params.status);
    }
    if (params.accountId) {
      items = items.filter(
        (t) => t.accountId === params.accountId || t.counterpartyAccountId === params.accountId,
      );
    }
    if (params.counterpartyAccountId) {
      items = items.filter(
        (t) => t.counterpartyAccountId === params.counterpartyAccountId,
      );
    }
    if (params.currency) {
      items = items.filter((t) => t.currency === params.currency);
    }
    if (params.minAmount) {
      const min = parseFloat(params.minAmount);
      items = items.filter((t) => parseFloat(t.amount) >= min);
    }
    if (params.maxAmount) {
      const max = parseFloat(params.maxAmount);
      items = items.filter((t) => parseFloat(t.amount) <= max);
    }
    if (params.createdFrom) {
      const createdFrom = params.createdFrom;
      items = items.filter((t) => t.createdAt >= createdFrom);
    }
    if (params.createdTo) {
      const createdTo = params.createdTo;
      items = items.filter((t) => t.createdAt <= createdTo);
    }
    if (params.createdBy) {
      items = items.filter((t) => t.createdBy === params.createdBy);
    }

    // Sort by createdAt descending (most recent first)
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalCount = items.length;

    // Cursor-based pagination
    if (params.cursor) {
      const cursorIndex = items.findIndex((t) => t.id === params.cursor);
      if (cursorIndex >= 0) {
        items = items.slice(cursorIndex + 1);
      }
    }

    const page = items.slice(0, params.limit);
    const lastItem = page.at(-1);
    const nextCursor = page.length === params.limit && lastItem ? lastItem.id : undefined;

    return { items: page, nextCursor, totalCount };
  }

  async findByAccount(
    accountId: string,
    limit: number,
    cursor?: string,
  ): Promise<TransactionSearchResult> {
    return this.search({ accountId, limit, cursor });
  }

  async existsByReference(reference: string): Promise<boolean> {
    return this.referenceIndex.has(reference);
  }

  async existsByIdempotencyKey(key: string): Promise<boolean> {
    return this.idempotencyIndex.has(key);
  }

  /**
   * Count transactions for an account within a date range (for velocity/limit checks).
   */
  async countByAccountAndDateRange(
    accountId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    let count = 0;
    for (const txn of this.transactions.values()) {
      if (txn.accountId === accountId && txn.createdAt >= from && txn.createdAt <= to) {
        count++;
      }
    }
    return count;
  }

  /**
   * Sum transaction amounts for an account within a date range (for daily limit checks).
   */
  async sumAmountByAccountAndDateRange(
    accountId: string,
    from: Date,
    to: Date,
    type?: string,
  ): Promise<string> {
    let total = 0;
    for (const txn of this.transactions.values()) {
      if (
        txn.accountId === accountId &&
        txn.createdAt >= from &&
        txn.createdAt <= to &&
        (!type || txn.type === type)
      ) {
        total += parseFloat(txn.amount);
      }
    }
    return total.toFixed(2);
  }

  /**
   * Get all transactions for statement generation.
   */
  async findByAccountAndDateRange(
    accountId: string,
    from: Date,
    to: Date,
  ): Promise<TransactionRecord[]> {
    const items: TransactionRecord[] = [];
    for (const txn of this.transactions.values()) {
      if (txn.accountId === accountId && txn.createdAt >= from && txn.createdAt <= to) {
        items.push(txn);
      }
    }
    return items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}