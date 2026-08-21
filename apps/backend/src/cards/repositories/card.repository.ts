import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  CardNetwork as PrismaCardNetwork,
  CardSpendingCategory as PrismaCardSpendingCategory,
  CardStatus as PrismaCardStatus,
  CardTransactionStatus as PrismaCardTransactionStatus,
  CardTransactionType as PrismaCardTransactionType,
  CardType as PrismaCardType,
  DeclineReason as PrismaDeclineReason,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CardDeclineReason,
  CardNetwork,
  CardSpendingCategory,
  CardStatus,
  CardTransactionStatus,
  CardTransactionType,
  CardType,
} from '../enums/card.enums';

export interface CardLimitRecord {
  dailyLimit?: string;
  weeklyLimit?: string;
  monthlyLimit?: string;
  perTransactionLimit?: string;
  atmLimit?: string;
  onlineLimit?: string;
  contactlessLimit?: string;
  merchantLimit?: string;
  countryLimit?: string;
  velocityLimit?: string;
}

export interface CardRecord {
  id: string;
  accountId: string;
  customerId?: string;
  cardNumber: string;
  maskedNumber: string;
  lastFour: string;
  cardToken: string;
  expiryMonth: number;
  expiryYear: number;
  cvvHash: string;
  cardholderName: string;
  nickname?: string;
  type: CardType;
  network: CardNetwork;
  status: CardStatus;
  spendingCategory: CardSpendingCategory;
  spendingControls?: CardLimitRecord;
  dailyLimit?: string;
  weeklyLimit?: string;
  monthlyLimit?: string;
  singleTxLimit?: string;
  pinHash?: string;
  pinSetAt?: Date;
  contactlessEnabled: boolean;
  onlineEnabled: boolean;
  internationalEnabled: boolean;
  atmEnabled: boolean;
  frozenAt?: Date;
  freezeReason?: string;
  /**
   * Who froze the card. An 'ADMIN' freeze can only be cleared by an admin —
   * the customer's own unfreeze call is rejected while this is set. Not part
   * of any customer-facing DTO; stripped out before the response ever reaches
   * the customer, and stored alongside the other non-columned card fields
   * (nickname, spendingControls, ...) rather than as a new Prisma column.
   */
  frozenBy?: 'CUSTOMER' | 'ADMIN';
  activatedAt?: Date;
  closedAt?: Date;
  isDemo: boolean;
  metadata?: Record<string, string>;
  replacementCardId?: string;
  replacesCardId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CardHolderRecord {
  id: string;
  cardId: string;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualCardRecord {
  id: string;
  cardId: string;
  virtualNumber: string;
  expiryMonth: number;
  expiryYear: number;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  merchantRestriction?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CardTransactionRecord {
  id: string;
  cardId: string;
  transactionId?: string;
  holdId?: string;
  type: CardTransactionType;
  status: CardTransactionStatus;
  amount: string;
  currency: string;
  merchantName?: string;
  merchantCategoryCode?: string;
  merchantCity?: string;
  merchantCountry?: string;
  isOnline: boolean;
  isInternational: boolean;
  isContactless: boolean;
  declineReason?: CardDeclineReason;
  authorizationCode?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  settledAt?: Date;
}

export interface CardSearchParams {
  cardNumber?: string;
  status?: CardStatus;
  type?: CardType;
  accountId?: string;
  customerId?: string;
  merchantName?: string;
  fromDate?: Date;
  toDate?: Date;
  transactionId?: string;
  limit: number;
  cursor?: string;
}

export interface CardTransactionSearchParams {
  cardId?: string;
  type?: CardTransactionType;
  status?: CardTransactionStatus;
  merchantName?: string;
  transactionId?: string;
  accountId?: string;
  customerId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit: number;
  cursor?: string;
}

export interface CardSearchResult {
  items: CardRecord[];
  nextCursor?: string;
  totalCount: number;
}

export interface CardTransactionSearchResult {
  items: CardTransactionRecord[];
  nextCursor?: string;
  totalCount: number;
}

/**
 * Persists cards through Prisma so that customer applications, admin approvals
 * and the admin portal all read/write the SAME source of truth (previously the
 * repository was in-memory, so admin never saw customer-created cards).
 *
 * The cards domain carries a richer set of enum values and a few fields that the
 * database schema does not model as columns (card token, masked number, nickname,
 * weekly limit, spending controls, replacement links, hold id, settledAt). Those
 * are stored under a reserved `__ext` key inside the row's JSON `metadata` and
 * rebuilt on read. Enum values are stored directly — the Prisma card enums are
 * supersets that already include every domain value.
 */
const EXT_KEY = '__ext';

@Injectable()
export class CardRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async saveCard(card: CardRecord): Promise<CardRecord> {
    const data = this.toCardData(card);
    const row = await this.prisma.card.upsert({
      where: { id: card.id },
      create: {
        id: card.id,
        createdAt: card.createdAt ?? new Date(),
        ...data,
      } as Prisma.CardUncheckedCreateInput,
      update: data as Prisma.CardUncheckedUpdateInput,
    });
    return this.toCardRecord(row);
  }

  async findCardById(cardId: string): Promise<CardRecord | null> {
    const row = await this.prisma.card.findUnique({ where: { id: cardId } });
    return row ? this.toCardRecord(row) : null;
  }

  async findCardByToken(cardToken: string): Promise<CardRecord | null> {
    const rows = await this.prisma.card.findMany({ where: { deletedAt: null } });
    const match = rows
      .map((row) => this.toCardRecord(row))
      .find((card) => card.cardToken === cardToken);
    return match ?? null;
  }

  async findCardByMaskedNumber(maskedNumber: string): Promise<CardRecord | null> {
    const rows = await this.prisma.card.findMany({ where: { deletedAt: null } });
    const match = rows
      .map((row) => this.toCardRecord(row))
      .find(
        (card) => card.maskedNumber === maskedNumber || card.maskedNumber.includes(maskedNumber),
      );
    return match ?? null;
  }

  async findCardsByAccountId(accountId: string): Promise<CardRecord[]> {
    const rows = await this.prisma.card.findMany({ where: { accountId, deletedAt: null } });
    return rows.map((row) => this.toCardRecord(row));
  }

  async countCardsByAccountId(accountId: string): Promise<number> {
    return this.prisma.card.count({ where: { accountId, deletedAt: null } });
  }

  async saveHolder(holder: CardHolderRecord): Promise<CardHolderRecord> {
    const row = await this.prisma.cardHolder.upsert({
      where: { id: holder.id },
      create: {
        id: holder.id,
        cardId: holder.cardId,
        userId: holder.userId,
        role: holder.role,
        createdAt: holder.createdAt ?? new Date(),
      },
      update: { role: holder.role },
    });
    return this.toHolderRecord(row);
  }

  async findPrimaryHolderByCardId(cardId: string): Promise<CardHolderRecord | null> {
    const row = await this.prisma.cardHolder.findFirst({ where: { cardId, role: 'PRIMARY' } });
    return row ? this.toHolderRecord(row) : null;
  }

  async findHoldersByUserId(userId: string): Promise<CardHolderRecord[]> {
    const rows = await this.prisma.cardHolder.findMany({ where: { userId } });
    return rows.map((row) => this.toHolderRecord(row));
  }

  async saveVirtualCard(virtualCard: VirtualCardRecord): Promise<VirtualCardRecord> {
    const existing = await this.prisma.virtualCard.findFirst({
      where: { cardId: virtualCard.cardId },
    });
    const data = {
      virtualNumber: virtualCard.virtualNumber,
      expiryMonth: virtualCard.expiryMonth,
      expiryYear: virtualCard.expiryYear,
      isActive: virtualCard.isActive,
      usageLimit: virtualCard.usageLimit ?? null,
      usageCount: virtualCard.usageCount,
      merchantRestriction: virtualCard.merchantRestriction ?? null,
      expiresAt: virtualCard.expiresAt ?? null,
    };
    const row = existing
      ? await this.prisma.virtualCard.update({ where: { id: existing.id }, data })
      : await this.prisma.virtualCard.create({
          data: {
            id: virtualCard.id,
            cardId: virtualCard.cardId,
            createdAt: virtualCard.createdAt ?? new Date(),
            ...data,
          },
        });
    return this.toVirtualRecord(row);
  }

  async findVirtualCardByCardId(cardId: string): Promise<VirtualCardRecord | null> {
    const row = await this.prisma.virtualCard.findFirst({ where: { cardId } });
    return row ? this.toVirtualRecord(row) : null;
  }

  async saveTransaction(transaction: CardTransactionRecord): Promise<CardTransactionRecord> {
    const data = this.toTransactionData(transaction);
    const row = await this.prisma.cardTransaction.upsert({
      where: { id: transaction.id },
      create: {
        id: transaction.id,
        createdAt: transaction.createdAt ?? new Date(),
        ...data,
      } as Prisma.CardTransactionUncheckedCreateInput,
      update: data as Prisma.CardTransactionUncheckedUpdateInput,
    });
    return this.toTransactionRecord(row);
  }

  async findTransactionById(transactionId: string): Promise<CardTransactionRecord | null> {
    const row = await this.prisma.cardTransaction.findUnique({ where: { id: transactionId } });
    return row ? this.toTransactionRecord(row) : null;
  }

  async findTransactionByLedgerTransactionId(
    ledgerTransactionId: string,
  ): Promise<CardTransactionRecord | null> {
    const row = await this.prisma.cardTransaction.findFirst({
      where: { transactionId: ledgerTransactionId },
    });
    return row ? this.toTransactionRecord(row) : null;
  }

  async findTransactionsByCardId(cardId: string): Promise<CardTransactionRecord[]> {
    const rows = await this.prisma.cardTransaction.findMany({ where: { cardId } });
    return rows.map((row) => this.toTransactionRecord(row));
  }

  async findTransactionsByDateRange(
    cardId: string,
    from: Date,
    to: Date,
  ): Promise<CardTransactionRecord[]> {
    return (await this.findTransactionsByCardId(cardId)).filter(
      (transaction) => transaction.createdAt >= from && transaction.createdAt <= to,
    );
  }

  async sumTransactionsByCardIdAndDateRange(cardId: string, from: Date, to: Date): Promise<string> {
    const total = (await this.findTransactionsByDateRange(cardId, from, to)).reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    return total.toFixed(2);
  }

  async countTransactionsByCardIdAndDateRange(
    cardId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    return (await this.findTransactionsByDateRange(cardId, from, to)).length;
  }

  async searchCards(params: CardSearchParams): Promise<CardSearchResult> {
    const rows = await this.prisma.card.findMany({
      where: { deletedAt: null, ...(params.accountId ? { accountId: params.accountId } : {}) },
    });
    let items = rows.map((row) => this.toCardRecord(row));

    if (params.cardNumber) {
      const cardNumber = params.cardNumber;
      items = items.filter(
        (card) => card.maskedNumber.includes(cardNumber) || card.cardToken.includes(cardNumber),
      );
    }
    if (params.status) {
      items = items.filter((card) => card.status === params.status);
    }
    if (params.type) {
      items = items.filter((card) => card.type === params.type);
    }
    if (params.customerId) {
      items = items.filter((card) => card.customerId === params.customerId);
    }
    if (params.merchantName || params.transactionId || params.fromDate || params.toDate) {
      const transactions = await this.prisma.cardTransaction.findMany({});
      const cardsWithTransactions = new Set<string>();
      for (const transaction of transactions) {
        if (params.transactionId && transaction.transactionId !== params.transactionId) continue;
        if (
          params.merchantName &&
          !(transaction.merchantName ?? '')
            .toLowerCase()
            .includes(params.merchantName.toLowerCase())
        )
          continue;
        if (params.fromDate && transaction.createdAt < params.fromDate) continue;
        if (params.toDate && transaction.createdAt > params.toDate) continue;
        cardsWithTransactions.add(transaction.cardId);
      }
      items = items.filter((card) => cardsWithTransactions.has(card.id));
    }

    return this.paginate(items, params.limit, params.cursor);
  }

  async searchTransactions(
    params: CardTransactionSearchParams,
  ): Promise<CardTransactionSearchResult> {
    const rows = await this.prisma.cardTransaction.findMany({
      where: { ...(params.cardId ? { cardId: params.cardId } : {}) },
    });
    let items = rows.map((row) => this.toTransactionRecord(row));

    if (params.type) items = items.filter((transaction) => transaction.type === params.type);
    if (params.status) items = items.filter((transaction) => transaction.status === params.status);
    if (params.merchantName) {
      const merchantName = params.merchantName.toLowerCase();
      items = items.filter((transaction) =>
        (transaction.merchantName ?? '').toLowerCase().includes(merchantName),
      );
    }
    if (params.transactionId)
      items = items.filter((transaction) => transaction.transactionId === params.transactionId);
    if (params.fromDate) {
      const fromDate = params.fromDate;
      items = items.filter((transaction) => transaction.createdAt >= fromDate);
    }
    if (params.toDate) {
      const toDate = params.toDate;
      items = items.filter((transaction) => transaction.createdAt <= toDate);
    }

    if (params.accountId || params.customerId) {
      const cards = (await this.prisma.card.findMany({ where: { deletedAt: null } })).map((row) =>
        this.toCardRecord(row),
      );
      const accountCardIds = new Set(
        cards
          .filter(
            (card) =>
              (!params.accountId || card.accountId === params.accountId) &&
              (!params.customerId || card.customerId === params.customerId),
          )
          .map((card) => card.id),
      );
      items = items.filter((transaction) => accountCardIds.has(transaction.cardId));
    }

    return this.paginate(items, params.limit, params.cursor);
  }

  async updateCard(card: CardRecord): Promise<CardRecord> {
    return this.saveCard(card);
  }

  async updateTransaction(transaction: CardTransactionRecord): Promise<CardTransactionRecord> {
    return this.saveTransaction(transaction);
  }

  // ─── Mapping helpers ──────────────────────────────────────────────────────

  private paginate<T extends { id: string; createdAt: Date }>(
    rows: T[],
    limit: number,
    cursor?: string,
  ): { items: T[]; nextCursor?: string; totalCount: number } {
    let items = [...rows].sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );
    const totalCount = items.length;
    if (cursor) {
      const cursorIndex = items.findIndex((item) => item.id === cursor);
      if (cursorIndex >= 0) items = items.slice(cursorIndex + 1);
    }
    const page = items.slice(0, limit);
    const lastItem = page.at(-1);
    return {
      items: page,
      nextCursor: page.length === limit && lastItem ? lastItem.id : undefined,
      totalCount,
    };
  }

  private splitMetadata(json: unknown): {
    metadata?: Record<string, string>;
    ext: Record<string, unknown>;
  } {
    const obj = json && typeof json === 'object' ? { ...(json as Record<string, unknown>) } : {};
    const ext = (obj[EXT_KEY] as Record<string, unknown>) ?? {};
    delete obj[EXT_KEY];
    const metadata = Object.keys(obj).length > 0 ? (obj as Record<string, string>) : undefined;
    return { metadata, ext };
  }

  private toCardData(card: CardRecord): Record<string, unknown> {
    const ext = {
      customerId: card.customerId,
      cardToken: card.cardToken,
      maskedNumber: card.maskedNumber,
      nickname: card.nickname,
      weeklyLimit: card.weeklyLimit,
      spendingControls: card.spendingControls,
      replacementCardId: card.replacementCardId,
      replacesCardId: card.replacesCardId,
      frozenBy: card.frozenBy,
    };
    const metadata = { ...(card.metadata ?? {}), [EXT_KEY]: ext };
    return {
      accountId: card.accountId,
      cardNumber: card.cardNumber,
      lastFour: card.lastFour,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      cvvHash: card.cvvHash,
      cardholderName: card.cardholderName,
      type: card.type as unknown as PrismaCardType,
      network: card.network as unknown as PrismaCardNetwork,
      status: card.status as unknown as PrismaCardStatus,
      spendingCategory: card.spendingCategory as unknown as PrismaCardSpendingCategory,
      dailyLimit: card.dailyLimit ? new Decimal(card.dailyLimit) : undefined,
      monthlyLimit: card.monthlyLimit ? new Decimal(card.monthlyLimit) : undefined,
      singleTxLimit: card.singleTxLimit ? new Decimal(card.singleTxLimit) : undefined,
      pinHash: card.pinHash ?? null,
      pinSetAt: card.pinSetAt ?? null,
      contactlessEnabled: card.contactlessEnabled,
      onlineEnabled: card.onlineEnabled,
      internationalEnabled: card.internationalEnabled,
      atmEnabled: card.atmEnabled,
      frozenAt: card.frozenAt ?? null,
      freezeReason: card.freezeReason ?? null,
      activatedAt: card.activatedAt ?? null,
      closedAt: card.closedAt ?? null,
      isDemo: card.isDemo,
      deletedAt: card.deletedAt ?? null,
      metadata: metadata as Prisma.InputJsonValue,
    };
  }

  private toCardRecord(row: Record<string, unknown>): CardRecord {
    const { metadata, ext } = this.splitMetadata(row.metadata);
    const lastFour = String(row.lastFour ?? '');
    return {
      id: row.id as string,
      accountId: row.accountId as string,
      customerId: (ext.customerId as string) ?? undefined,
      cardNumber: row.cardNumber as string,
      maskedNumber: (ext.maskedNumber as string) ?? `•••• •••• •••• ${lastFour}`,
      lastFour,
      cardToken: (ext.cardToken as string) ?? '',
      expiryMonth: row.expiryMonth as number,
      expiryYear: row.expiryYear as number,
      cvvHash: row.cvvHash as string,
      cardholderName: row.cardholderName as string,
      nickname: (ext.nickname as string) ?? undefined,
      type: row.type as unknown as CardType,
      network: row.network as unknown as CardNetwork,
      status: row.status as unknown as CardStatus,
      spendingCategory: row.spendingCategory as unknown as CardSpendingCategory,
      spendingControls: (ext.spendingControls as CardRecord['spendingControls']) ?? undefined,
      dailyLimit: row.dailyLimit != null ? String(row.dailyLimit) : undefined,
      weeklyLimit: (ext.weeklyLimit as string) ?? undefined,
      monthlyLimit: row.monthlyLimit != null ? String(row.monthlyLimit) : undefined,
      singleTxLimit: row.singleTxLimit != null ? String(row.singleTxLimit) : undefined,
      pinHash: (row.pinHash as string) ?? undefined,
      pinSetAt: (row.pinSetAt as Date) ?? undefined,
      contactlessEnabled: Boolean(row.contactlessEnabled),
      onlineEnabled: Boolean(row.onlineEnabled),
      internationalEnabled: Boolean(row.internationalEnabled),
      atmEnabled: Boolean(row.atmEnabled),
      frozenAt: (row.frozenAt as Date) ?? undefined,
      freezeReason: (row.freezeReason as string) ?? undefined,
      frozenBy: (ext.frozenBy as CardRecord['frozenBy']) ?? undefined,
      activatedAt: (row.activatedAt as Date) ?? undefined,
      closedAt: (row.closedAt as Date) ?? undefined,
      isDemo: Boolean(row.isDemo),
      metadata,
      replacementCardId: (ext.replacementCardId as string) ?? undefined,
      replacesCardId: (ext.replacesCardId as string) ?? undefined,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      deletedAt: (row.deletedAt as Date) ?? undefined,
    };
  }

  private toHolderRecord(row: Record<string, unknown>): CardHolderRecord {
    return {
      id: row.id as string,
      cardId: row.cardId as string,
      userId: row.userId as string,
      role: row.role as string,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    };
  }

  private toVirtualRecord(row: Record<string, unknown>): VirtualCardRecord {
    return {
      id: row.id as string,
      cardId: row.cardId as string,
      virtualNumber: row.virtualNumber as string,
      expiryMonth: row.expiryMonth as number,
      expiryYear: row.expiryYear as number,
      isActive: Boolean(row.isActive),
      usageLimit: (row.usageLimit as number) ?? undefined,
      usageCount: row.usageCount as number,
      merchantRestriction: (row.merchantRestriction as string) ?? undefined,
      expiresAt: (row.expiresAt as Date) ?? undefined,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      deletedAt: (row.deletedAt as Date) ?? undefined,
    };
  }

  private toTransactionData(transaction: CardTransactionRecord): Record<string, unknown> {
    const ext = { holdId: transaction.holdId, settledAt: transaction.settledAt?.toISOString() };
    const metadata = { ...(transaction.metadata ?? {}), [EXT_KEY]: ext };
    return {
      cardId: transaction.cardId,
      transactionId: transaction.transactionId ?? null,
      type: transaction.type as unknown as PrismaCardTransactionType,
      status: transaction.status as unknown as PrismaCardTransactionStatus,
      amount: new Decimal(transaction.amount),
      currency: transaction.currency,
      merchantName: transaction.merchantName ?? null,
      merchantCategoryCode: transaction.merchantCategoryCode ?? null,
      merchantCity: transaction.merchantCity ?? null,
      merchantCountry: transaction.merchantCountry ?? null,
      isOnline: transaction.isOnline,
      isInternational: transaction.isInternational,
      isContactless: transaction.isContactless,
      declineReason: transaction.declineReason
        ? (transaction.declineReason as unknown as PrismaDeclineReason)
        : null,
      authorizationCode: transaction.authorizationCode ?? null,
      metadata: metadata as Prisma.InputJsonValue,
    };
  }

  private toTransactionRecord(row: Record<string, unknown>): CardTransactionRecord {
    const { metadata, ext } = this.splitMetadata(row.metadata);
    return {
      id: row.id as string,
      cardId: row.cardId as string,
      transactionId: (row.transactionId as string) ?? undefined,
      holdId: (ext.holdId as string) ?? undefined,
      type: row.type as unknown as CardTransactionType,
      status: row.status as unknown as CardTransactionStatus,
      amount: String(row.amount),
      currency: row.currency as string,
      merchantName: (row.merchantName as string) ?? undefined,
      merchantCategoryCode: (row.merchantCategoryCode as string) ?? undefined,
      merchantCity: (row.merchantCity as string) ?? undefined,
      merchantCountry: (row.merchantCountry as string) ?? undefined,
      isOnline: Boolean(row.isOnline),
      isInternational: Boolean(row.isInternational),
      isContactless: Boolean(row.isContactless),
      declineReason: (row.declineReason as unknown as CardDeclineReason) ?? undefined,
      authorizationCode: (row.authorizationCode as string) ?? undefined,
      metadata,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      settledAt: ext.settledAt ? new Date(ext.settledAt as string) : undefined,
    };
  }
}
