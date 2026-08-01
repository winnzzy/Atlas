import type { CardTransactionStatus, CardTransactionType } from '../enums/card.enums';

export const CARD_EVENT_NAMES = {
  ISSUED: 'card.issued',
  ACTIVATED: 'card.activated',
  FROZEN: 'card.frozen',
  UNFROZEN: 'card.unfrozen',
  LOCKED: 'card.locked',
  UNLOCKED: 'card.unlocked',
  CANCELLED: 'card.cancelled',
  REISSUED: 'card.reissued',
  AUTHORIZATION: 'card.authorization',
  CAPTURED: 'card.captured',
  COMPLETED: 'card.completed',
  REFUNDED: 'card.refunded',
  REVERSED: 'card.reversed',
  CHARGEBACK: 'card.chargeback',
} as const;

export interface CardEventBase {
  cardId: string;
  accountId: string;
  customerId?: string;
  performedBy?: string;
  metadata?: Record<string, string>;
}

export interface CardIssuedEvent extends CardEventBase {
  cardType: string;
}

export interface CardStatusEvent extends CardEventBase {
  status: string;
  reason?: string;
}

export interface CardTransactionEvent extends CardEventBase {
  cardTransactionId: string;
  transactionId?: string;
  holdId?: string;
  type: CardTransactionType;
  status: CardTransactionStatus;
  amount: string;
  currency: string;
  merchantName?: string;
  authorizationCode?: string;
}
