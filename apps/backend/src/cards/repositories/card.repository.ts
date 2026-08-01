import { Injectable } from '@nestjs/common';
import type { CardDeclineReason, CardNetwork, CardSpendingCategory, CardStatus, CardTransactionStatus, CardTransactionType, CardType } from '../enums/card.enums';

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

@Injectable()
export class CardRepository {
  private readonly cards = new Map<string, CardRecord>();
  private readonly cardHolders = new Map<string, CardHolderRecord>();
  private readonly virtualCards = new Map<string, VirtualCardRecord>();
  private readonly cardTransactions = new Map<string, CardTransactionRecord>();

  async saveCard(card: CardRecord): Promise<CardRecord> {
    this.cards.set(card.id, { ...card, updatedAt: new Date() });
    const stored = this.cards.get(card.id);
    if (!stored) {
      throw new Error(`Card ${card.id} could not be stored`);
    }
    return stored;
  }

  async findCardById(cardId: string): Promise<CardRecord | null> {
    return this.cards.get(cardId) ?? null;
  }

  async findCardByToken(cardToken: string): Promise<CardRecord | null> {
    for (const card of this.cards.values()) {
      if (card.cardToken === cardToken) {
        return card;
      }
    }
    return null;
  }

  async findCardByMaskedNumber(maskedNumber: string): Promise<CardRecord | null> {
    for (const card of this.cards.values()) {
      if (card.maskedNumber === maskedNumber || card.maskedNumber.includes(maskedNumber)) {
        return card;
      }
    }
    return null;
  }

  async findCardsByAccountId(accountId: string): Promise<CardRecord[]> {
    return Array.from(this.cards.values()).filter((card) => card.accountId === accountId && !card.deletedAt);
  }

  async countCardsByAccountId(accountId: string): Promise<number> {
    return (await this.findCardsByAccountId(accountId)).length;
  }

  async saveHolder(holder: CardHolderRecord): Promise<CardHolderRecord> {
    this.cardHolders.set(holder.id, { ...holder, updatedAt: new Date() });
    const stored = this.cardHolders.get(holder.id);
    if (!stored) {
      throw new Error(`Card holder ${holder.id} could not be stored`);
    }
    return stored;
  }

  async findPrimaryHolderByCardId(cardId: string): Promise<CardHolderRecord | null> {
    for (const holder of this.cardHolders.values()) {
      if (holder.cardId === cardId && holder.role === 'PRIMARY') {
        return holder;
      }
    }
    return null;
  }

  async findHoldersByUserId(userId: string): Promise<CardHolderRecord[]> {
    return Array.from(this.cardHolders.values()).filter((holder) => holder.userId === userId);
  }

  async saveVirtualCard(virtualCard: VirtualCardRecord): Promise<VirtualCardRecord> {
    this.virtualCards.set(virtualCard.cardId, { ...virtualCard, updatedAt: new Date() });
    const stored = this.virtualCards.get(virtualCard.cardId);
    if (!stored) {
      throw new Error(`Virtual card ${virtualCard.cardId} could not be stored`);
    }
    return stored;
  }

  async findVirtualCardByCardId(cardId: string): Promise<VirtualCardRecord | null> {
    return this.virtualCards.get(cardId) ?? null;
  }

  async saveTransaction(transaction: CardTransactionRecord): Promise<CardTransactionRecord> {
    this.cardTransactions.set(transaction.id, { ...transaction, updatedAt: new Date() });
    const stored = this.cardTransactions.get(transaction.id);
    if (!stored) {
      throw new Error(`Card transaction ${transaction.id} could not be stored`);
    }
    return stored;
  }

  async findTransactionById(transactionId: string): Promise<CardTransactionRecord | null> {
    return this.cardTransactions.get(transactionId) ?? null;
  }

  async findTransactionByLedgerTransactionId(ledgerTransactionId: string): Promise<CardTransactionRecord | null> {
    for (const transaction of this.cardTransactions.values()) {
      if (transaction.transactionId === ledgerTransactionId) {
        return transaction;
      }
    }
    return null;
  }

  async findTransactionsByCardId(cardId: string): Promise<CardTransactionRecord[]> {
    return Array.from(this.cardTransactions.values()).filter((transaction) => transaction.cardId === cardId);
  }

  async findTransactionsByDateRange(cardId: string, from: Date, to: Date): Promise<CardTransactionRecord[]> {
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

  async countTransactionsByCardIdAndDateRange(cardId: string, from: Date, to: Date): Promise<number> {
    return (await this.findTransactionsByDateRange(cardId, from, to)).length;
  }

  async searchCards(params: CardSearchParams): Promise<CardSearchResult> {
    let items = Array.from(this.cards.values()).filter((card) => !card.deletedAt);

    if (params.cardNumber) {
      const cardNumber = params.cardNumber;
      items = items.filter((card) => card.maskedNumber.includes(cardNumber) || card.cardToken.includes(cardNumber));
    }
    if (params.status) {
      items = items.filter((card) => card.status === params.status);
    }
    if (params.type) {
      items = items.filter((card) => card.type === params.type);
    }
    if (params.accountId) {
      items = items.filter((card) => card.accountId === params.accountId);
    }
    if (params.customerId) {
      items = items.filter((card) => card.customerId === params.customerId);
    }
    if (params.merchantName || params.transactionId || params.fromDate || params.toDate) {
      const cardsWithTransactions = new Set<string>();
      for (const transaction of this.cardTransactions.values()) {
        if (params.transactionId && transaction.transactionId !== params.transactionId) {
          continue;
        }
        if (params.merchantName && !(transaction.merchantName ?? '').toLowerCase().includes(params.merchantName.toLowerCase())) {
          continue;
        }
        if (params.fromDate && transaction.createdAt < params.fromDate) {
          continue;
        }
        if (params.toDate && transaction.createdAt > params.toDate) {
          continue;
        }
        cardsWithTransactions.add(transaction.cardId);
      }
      items = items.filter((card) => cardsWithTransactions.has(card.id));
    }

    items.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const totalCount = items.length;

    if (params.cursor) {
      const cursorIndex = items.findIndex((card) => card.id === params.cursor);
      if (cursorIndex >= 0) {
        items = items.slice(cursorIndex + 1);
      }
    }

    const page = items.slice(0, params.limit);
    const lastItem = page.at(-1);
    return {
      items: page,
      nextCursor: page.length === params.limit && lastItem ? lastItem.id : undefined,
      totalCount,
    };
  }

  async searchTransactions(params: CardTransactionSearchParams): Promise<CardTransactionSearchResult> {
    let items = Array.from(this.cardTransactions.values());

    if (params.cardId) {
      items = items.filter((transaction) => transaction.cardId === params.cardId);
    }
    if (params.type) {
      items = items.filter((transaction) => transaction.type === params.type);
    }
    if (params.status) {
      items = items.filter((transaction) => transaction.status === params.status);
    }
    if (params.merchantName) {
      const merchantName = params.merchantName;
      items = items.filter((transaction) => (transaction.merchantName ?? '').toLowerCase().includes(merchantName.toLowerCase()));
    }
    if (params.transactionId) {
      items = items.filter((transaction) => transaction.transactionId === params.transactionId);
    }
    if (params.fromDate) {
      const fromDate = params.fromDate;
      items = items.filter((transaction) => transaction.createdAt >= fromDate);
    }
    if (params.toDate) {
      const toDate = params.toDate;
      items = items.filter((transaction) => transaction.createdAt <= toDate);
    }

    if (params.accountId || params.customerId) {
      const accountCardIds = new Set(
        Array.from(this.cards.values())
          .filter((card) => (!params.accountId || card.accountId === params.accountId) && (!params.customerId || card.customerId === params.customerId))
          .map((card) => card.id),
      );
      items = items.filter((transaction) => accountCardIds.has(transaction.cardId));
    }

    items.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const totalCount = items.length;

    if (params.cursor) {
      const cursorIndex = items.findIndex((transaction) => transaction.id === params.cursor);
      if (cursorIndex >= 0) {
        items = items.slice(cursorIndex + 1);
      }
    }

    const page = items.slice(0, params.limit);
    const lastItem = page.at(-1);
    return {
      items: page,
      nextCursor: page.length === params.limit && lastItem ? lastItem.id : undefined,
      totalCount,
    };
  }

  async updateCard(card: CardRecord): Promise<CardRecord> {
    return this.saveCard(card);
  }

  async updateTransaction(transaction: CardTransactionRecord): Promise<CardTransactionRecord> {
    return this.saveTransaction(transaction);
  }
}
