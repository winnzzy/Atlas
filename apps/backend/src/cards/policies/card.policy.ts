import { Inject, Injectable } from '@nestjs/common';
import { CardStatus, CardTransactionStatus, TERMINAL_CARD_STATUSES } from '../enums/card.enums';
import type { CardRecord, CardTransactionRecord } from '../repositories/card.repository';
import { CardValidator } from '../validators/card.validator';

export interface CardPolicyResult {
  allowed: boolean;
  violations: string[];
}

@Injectable()
export class CardPolicy {
  constructor(@Inject(CardValidator) private readonly validator: CardValidator) {}

  canIssueCard(existingCardCount: number): CardPolicyResult {
    const violations: string[] = [];
    if (existingCardCount >= 3) {
      violations.push('Each account can have at most 3 cards');
    }
    return { allowed: violations.length === 0, violations };
  }

  canTransitionCard(card: CardRecord, allowedStatuses: CardStatus[]): CardPolicyResult {
    if (TERMINAL_CARD_STATUSES.has(card.status)) {
      return { allowed: false, violations: [`Card ${card.id} is terminal and cannot be modified`] };
    }

    if (!allowedStatuses.includes(card.status)) {
      return { allowed: false, violations: [`Card ${card.id} cannot transition from ${card.status}`] };
    }

    return { allowed: true, violations: [] };
  }

  canAuthorizeTransaction(card: CardRecord, amount: string, context: { isOnline?: boolean; isInternational?: boolean; isContactless?: boolean; merchantName?: string; merchantCountry?: string; accountBalance?: string; recentDaySpend?: string; recentWeekSpend?: string; recentMonthSpend?: string; }): CardPolicyResult {
    const violations: string[] = [];

    if (!this.validator.validateAmount(amount)) {
      violations.push('Card transaction amount must be positive');
    }

    if (card.status !== CardStatus.ACTIVATED) {
      violations.push(`Card ${card.id} is not active`);
    }

    if (card.status === CardStatus.FROZEN || card.status === CardStatus.LOCKED || card.status === CardStatus.CANCELLED) {
      violations.push(`Card ${card.id} is not available for authorization`);
    }

    if (context.isOnline && !card.onlineEnabled) {
      violations.push('Online transactions are disabled for this card');
    }

    if (context.isInternational && !card.internationalEnabled) {
      violations.push('International transactions are disabled for this card');
    }

    if (context.isContactless && !card.contactlessEnabled) {
      violations.push('Contactless transactions are disabled for this card');
    }

    if (Number(amount) > Number(card.singleTxLimit ?? '0')) {
      violations.push('Amount exceeds the per-transaction card limit');
    }

    if (context.accountBalance && Number(context.accountBalance) < Number(amount)) {
      violations.push('Insufficient available balance for card authorization');
    }

    if (context.recentDaySpend && Number(context.recentDaySpend) + Number(amount) > Number(card.dailyLimit ?? '0')) {
      violations.push('Amount exceeds the daily card limit');
    }

    if (context.recentMonthSpend && Number(context.recentMonthSpend) + Number(amount) > Number(card.monthlyLimit ?? '0')) {
      violations.push('Amount exceeds the monthly card limit');
    }

    if (card.type === 'MERCHANT_LOCKED_VIRTUAL' && card.metadata?.merchantRestriction && context.merchantName) {
      const restriction = String(card.metadata.merchantRestriction).toLowerCase();
      if (!context.merchantName.toLowerCase().includes(restriction)) {
        violations.push('Merchant is not allowed on this merchant-locked virtual card');
      }
    }

    return { allowed: violations.length === 0, violations };
  }

  canCaptureTransaction(transaction: CardTransactionRecord): CardPolicyResult {
    const violations: string[] = [];
    if (transaction.status !== CardTransactionStatus.AUTHORIZED) {
      violations.push(`Card transaction ${transaction.id} cannot be captured from ${transaction.status}`);
    }
    return { allowed: violations.length === 0, violations };
  }

  canRefundTransaction(transaction: CardTransactionRecord): CardPolicyResult {
    const violations: string[] = [];
    if (!['CAPTURED', 'COMPLETED', 'REFUNDED'].includes(transaction.status)) {
      violations.push(`Card transaction ${transaction.id} cannot be refunded from ${transaction.status}`);
    }
    return { allowed: violations.length === 0, violations };
  }

  canReverseTransaction(transaction: CardTransactionRecord): CardPolicyResult {
    const violations: string[] = [];
    if (!['AUTHORIZED', 'CAPTURED', 'COMPLETED', 'PENDING'].includes(transaction.status)) {
      violations.push(`Card transaction ${transaction.id} cannot be reversed from ${transaction.status}`);
    }
    return { allowed: violations.length === 0, violations };
  }
}
