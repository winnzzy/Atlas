import { Injectable } from '@nestjs/common';
import type { CardRecord, CardTransactionRecord } from '../repositories/card.repository';
import type { CardRevealResponseDto, CardResponseDto, CardSearchResponseDto, CardTransactionResponseDto, CardTransactionSearchResponseDto } from '../dto/cards.dto';

@Injectable()
export class CardMapper {
  toCardResponse(card: CardRecord): CardResponseDto {
    return {
      id: card.id,
      accountId: card.accountId,
      customerId: card.customerId,
      type: card.type,
      status: card.status,
      network: card.network,
      maskedNumber: card.maskedNumber,
      lastFour: card.lastFour,
      nickname: card.nickname,
      cardholderName: card.cardholderName,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      cardToken: card.cardToken,
      spendingCategory: card.spendingCategory,
      spendingControls: card.spendingControls,
      contactlessEnabled: card.contactlessEnabled,
      onlineEnabled: card.onlineEnabled,
      internationalEnabled: card.internationalEnabled,
      atmEnabled: card.atmEnabled,
      activatedAt: card.activatedAt,
      frozenAt: card.frozenAt,
      closedAt: card.closedAt,
      isDemo: card.isDemo,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      replacementCardId: card.replacementCardId,
    };
  }

  toCardSearchResponse(items: CardRecord[], totalCount: number, limit: number, nextCursor?: string): CardSearchResponseDto {
    return {
      items: items.map((card) => this.toCardResponse(card)),
      totalCount,
      limit,
      nextCursor,
    };
  }

  toCardTransactionResponse(transaction: CardTransactionRecord): CardTransactionResponseDto {
    return {
      id: transaction.id,
      cardId: transaction.cardId,
      transactionId: transaction.transactionId,
      holdId: transaction.holdId,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      merchantName: transaction.merchantName,
      merchantCategoryCode: transaction.merchantCategoryCode,
      merchantCity: transaction.merchantCity,
      merchantCountry: transaction.merchantCountry,
      isOnline: transaction.isOnline,
      isInternational: transaction.isInternational,
      isContactless: transaction.isContactless,
      declineReason: transaction.declineReason,
      authorizationCode: transaction.authorizationCode,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      settledAt: transaction.settledAt,
    };
  }

  toCardTransactionSearchResponse(items: CardTransactionRecord[], totalCount: number, limit: number, nextCursor?: string): CardTransactionSearchResponseDto {
    return {
      items: items.map((transaction) => this.toCardTransactionResponse(transaction)),
      totalCount,
      limit,
      nextCursor,
    };
  }

  toRevealResponse(card: CardRecord): CardRevealResponseDto {
    return {
      cardId: card.id,
      maskedNumber: card.maskedNumber,
      demoPan: card.cardNumber,
      demoCvv: card.cvvHash.replace(/^hash_/, '').slice(0, 3),
    };
  }
}
