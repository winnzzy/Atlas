import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { AccountService } from '../../accounts/services/account.service';
import { LedgerService } from '../../ledger/services/ledger.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import type { CreateHoldDto, ReleaseHoldDto } from '../../ledger/dto/hold.dto';
import { CardMapper } from '../mappers/card.mapper';
import { CardPolicy } from '../policies/card.policy';
import { CardRepository, type CardRecord, type CardTransactionRecord } from '../repositories/card.repository';
import { CardValidator } from '../validators/card.validator';
import { CARD_EVENT_NAMES, type CardEventBase } from '../events/card.events';
import { CardDeclineReason, CardNetwork, CardSpendingCategory, CardStatus, CardTransactionStatus, CardType, TERMINAL_CARD_STATUSES } from '../enums/card.enums';
import type {
  AuthorizeCardTransactionDto,
  CardResponseDto,
  CardSearchResponseDto,
  CardTransactionResponseDto,
  CardTransactionSearchResponseDto,
  ChangePinDto,
  CreateCardDto,
  RegenerateCvvDto,
  RefundCardTransactionDto,
  ReverseCardTransactionDto,
  SearchCardTransactionsDto,
  SearchCardsDto,
  UpdateCardDto,
} from '../dto/cards.dto';
import { CardNotFoundException, CardPolicyViolationException, CardTransactionNotFoundException, CardValidationException } from '../exceptions/card-domain.exception';
import type { AuthenticatedUser } from '../../accounts/policies/account.policy';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);
  private readonly auditLog: Array<{ cardId: string; action: string; performedBy: string; timestamp: Date; details?: Record<string, string> }> = [];

  constructor(
    @Inject(AccountService) private readonly accountService: AccountService,
    @Inject(TransactionService) private readonly transactionService: TransactionService,
    @Inject(LedgerService) private readonly ledgerService: LedgerService,
    @Inject(CardRepository) private readonly repository: CardRepository,
    @Inject(CardPolicy) private readonly policy: CardPolicy,
    @Inject(CardValidator) private readonly validator: CardValidator,
    @Inject(CardMapper) private readonly mapper: CardMapper,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  async issueCard(
    user: AuthenticatedUser,
    dto: CreateCardDto,
    options?: { requiresApproval?: boolean },
  ): Promise<CardResponseDto> {
    const account = await this.accountService.findById(dto.accountId);
    if (!account) {
      throw new CardValidationException(`Account ${dto.accountId} not found`);
    }

    if (!(await this.accountService.isAccountHolder(dto.accountId, user.id))) {
      throw new CardPolicyViolationException('You do not have permission to issue a card for this account');
    }

    const existingCardCount = await this.repository.countCardsByAccountId(dto.accountId);
    const policyResult = this.policy.canIssueCard(existingCardCount);
    if (!policyResult.allowed) {
      throw new CardPolicyViolationException(policyResult.violations.join('; '));
    }

    const cardholderName = dto.cardholderName ?? `${user.id}`;
    const network = dto.network ?? CardNetwork.VISA;
    const cardNumber = this.validator.generateCardNumber(network);
    const lastFour = cardNumber.slice(-4);
    const cardToken = this.validator.generateToken('card');
    const expiry = this.calculateExpiryDate();
    const cvv = this.validator.generateCvv();
    const isVirtual = dto.type !== CardType.PHYSICAL_DEBIT;
    // A customer-initiated request is only an application: it holds at REQUESTED
    // until an administrator approves it. Admin-initiated issuance skips ahead.
    const status = options?.requiresApproval
      ? CardStatus.REQUESTED
      : dto.type === CardType.PHYSICAL_DEBIT
        ? CardStatus.PENDING_VERIFICATION
        : CardStatus.ISSUED;

    const card: CardRecord = {
      id: randomUUID(),
      accountId: dto.accountId,
      customerId: user.id,
      cardNumber,
      maskedNumber: this.validator.maskCardNumber(cardNumber),
      lastFour,
      cardToken,
      expiryMonth: expiry.month,
      expiryYear: expiry.year,
      cvvHash: this.validator.hashValue(cvv),
      cardholderName,
      nickname: dto.nickname,
      type: dto.type,
      network,
      status,
      spendingCategory: dto.spendingCategory ?? CardSpendingCategory.GENERAL,
      spendingControls: dto.spendingControls,
      dailyLimit: dto.spendingControls?.dailyLimit ?? '5000.00',
      weeklyLimit: dto.spendingControls?.weeklyLimit ?? '15000.00',
      monthlyLimit: dto.spendingControls?.monthlyLimit ?? '25000.00',
      singleTxLimit: dto.spendingControls?.perTransactionLimit ?? '2500.00',
      pinHash: dto.pin ? this.validator.hashValue(dto.pin) : undefined,
      pinSetAt: dto.pin ? new Date() : undefined,
      contactlessEnabled: dto.contactlessEnabled ?? true,
      onlineEnabled: dto.onlineEnabled ?? true,
      internationalEnabled: dto.internationalEnabled ?? false,
      atmEnabled: dto.atmEnabled ?? true,
      isDemo: false,
      metadata: {
        accountStatus: String(account.status ?? 'ACTIVE'),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.saveCard(card);
    await this.repository.saveHolder({ id: randomUUID(), cardId: card.id, userId: user.id, role: 'PRIMARY', createdAt: new Date(), updatedAt: new Date() });

    if (isVirtual) {
      await this.repository.saveVirtualCard({
        id: randomUUID(),
        cardId: card.id,
        virtualNumber: this.validator.generateCardNumber(network),
        expiryMonth: expiry.month,
        expiryYear: expiry.year,
        isActive: true,
        usageLimit: dto.type === CardType.SINGLE_USE_VIRTUAL ? 1 : undefined,
        usageCount: 0,
        merchantRestriction: dto.type === CardType.MERCHANT_LOCKED_VIRTUAL ? dto.nickname : undefined,
        expiresAt: new Date(expiry.year, expiry.month, 0),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    this.audit('ISSUE', card, user.id, { type: card.type, network: card.network });
    this.emit(CARD_EVENT_NAMES.ISSUED, {
      cardId: card.id,
      accountId: card.accountId,
      customerId: card.customerId,
      performedBy: user.id,
      cardType: card.type,
    });

    return this.mapper.toCardResponse(card);
  }

  async getCard(user: AuthenticatedUser, cardId: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    return this.mapper.toCardResponse(card);
  }

  async searchCards(user: AuthenticatedUser, dto: SearchCardsDto): Promise<CardSearchResponseDto> {
    const result = await this.repository.searchCards({
      cardNumber: dto.cardNumber,
      status: dto.status,
      type: dto.type,
      accountId: dto.accountId,
      customerId: dto.customerId ?? user.id,
      merchantName: dto.merchantName,
      fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
      toDate: dto.toDate ? new Date(dto.toDate) : undefined,
      transactionId: dto.transactionId,
      limit: Number(dto.limit ?? 50),
      cursor: dto.cursor,
    });

    return this.mapper.toCardSearchResponse(result.items, result.totalCount, Number(dto.limit ?? 50), result.nextCursor);
  }

  async updateCard(user: AuthenticatedUser, cardId: string, dto: UpdateCardDto): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    if (card.status === CardStatus.CANCELLED || card.status === CardStatus.EXPIRED) {
      throw new CardPolicyViolationException(`Card ${card.id} cannot be updated in status ${card.status}`);
    }

    card.nickname = dto.nickname ?? card.nickname;
    card.contactlessEnabled = dto.contactlessEnabled ?? card.contactlessEnabled;
    card.onlineEnabled = dto.onlineEnabled ?? card.onlineEnabled;
    card.internationalEnabled = dto.internationalEnabled ?? card.internationalEnabled;
    card.atmEnabled = dto.atmEnabled ?? card.atmEnabled;
    card.spendingControls = dto.spendingControls ?? card.spendingControls;
    card.dailyLimit = dto.spendingControls?.dailyLimit ?? card.dailyLimit;
    card.weeklyLimit = dto.spendingControls?.weeklyLimit ?? card.weeklyLimit;
    card.monthlyLimit = dto.spendingControls?.monthlyLimit ?? card.monthlyLimit;
    card.singleTxLimit = dto.spendingControls?.perTransactionLimit ?? card.singleTxLimit;

    await this.repository.updateCard(card);
    this.audit('UPDATE', card, user.id, { cardId: card.id });
    return this.mapper.toCardResponse(card);
  }

  async activateCard(user: AuthenticatedUser, cardId: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    this.ensureTransition(card, [CardStatus.PENDING_VERIFICATION, CardStatus.ISSUED, CardStatus.REQUESTED]);
    card.status = CardStatus.ACTIVATED;
    card.activatedAt = new Date();
    await this.repository.updateCard(card);
    this.audit('ACTIVATE', card, user.id);
    this.emit(CARD_EVENT_NAMES.ACTIVATED, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, performedBy: user.id, status: card.status });
    return this.mapper.toCardResponse(card);
  }

  /**
   * Approves a pending card application. Physical cards still need the
   * verification step, so they land on PENDING_VERIFICATION rather than ISSUED.
   */
  async approveCardApplication(user: AuthenticatedUser, cardId: string, reviewerId: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    this.ensureTransition(card, [CardStatus.REQUESTED]);
    card.status =
      card.type === CardType.PHYSICAL_DEBIT ? CardStatus.PENDING_VERIFICATION : CardStatus.ISSUED;
    card.updatedAt = new Date();
    await this.repository.updateCard(card);
    this.audit('APPROVE', card, reviewerId);
    this.emit(CARD_EVENT_NAMES.ISSUED, {
      cardId: card.id,
      accountId: card.accountId,
      customerId: card.customerId,
      performedBy: reviewerId,
      cardType: card.type,
    });
    void user;
    return this.mapper.toCardResponse(card);
  }

  /** Rejects a pending card application, recording why. */
  async rejectCardApplication(user: AuthenticatedUser, cardId: string, reviewerId: string, reason?: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    this.ensureTransition(card, [CardStatus.REQUESTED, CardStatus.PENDING_VERIFICATION]);
    card.status = CardStatus.CANCELLED;
    card.closedAt = new Date();
    card.freezeReason = reason;
    card.updatedAt = new Date();
    await this.repository.updateCard(card);
    this.audit('REJECT', card, reviewerId, reason ? { reason } : undefined);
    this.emit(CARD_EVENT_NAMES.CANCELLED, {
      cardId: card.id,
      accountId: card.accountId,
      customerId: card.customerId,
      performedBy: reviewerId,
      status: card.status,
      reason,
    });
    void user;
    return this.mapper.toCardResponse(card);
  }

  async freezeCard(user: AuthenticatedUser, cardId: string, reason?: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    this.ensureTransition(card, [CardStatus.ACTIVATED, CardStatus.ISSUED]);
    card.status = CardStatus.FROZEN;
    card.frozenAt = new Date();
    card.freezeReason = reason;
    await this.repository.updateCard(card);
    this.audit('FREEZE', card, user.id, reason ? { reason } : undefined);
    this.emit(CARD_EVENT_NAMES.FROZEN, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, performedBy: user.id, status: card.status, reason });
    return this.mapper.toCardResponse(card);
  }

  async unfreezeCard(user: AuthenticatedUser, cardId: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    this.ensureTransition(card, [CardStatus.FROZEN]);
    card.status = CardStatus.ACTIVATED;
    card.frozenAt = undefined;
    card.freezeReason = undefined;
    await this.repository.updateCard(card);
    this.audit('UNFREEZE', card, user.id);
    this.emit(CARD_EVENT_NAMES.UNFROZEN, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, performedBy: user.id, status: card.status });
    return this.mapper.toCardResponse(card);
  }

  async lockCard(user: AuthenticatedUser, cardId: string, reason?: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    this.ensureTransition(card, [CardStatus.ACTIVATED, CardStatus.FROZEN]);
    card.status = CardStatus.LOCKED;
    card.freezeReason = reason;
    await this.repository.updateCard(card);
    this.audit('LOCK', card, user.id, reason ? { reason } : undefined);
    this.emit(CARD_EVENT_NAMES.LOCKED, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, performedBy: user.id, status: card.status, reason });
    return this.mapper.toCardResponse(card);
  }

  async unlockCard(user: AuthenticatedUser, cardId: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    this.ensureTransition(card, [CardStatus.LOCKED]);
    card.status = CardStatus.ACTIVATED;
    await this.repository.updateCard(card);
    this.audit('UNLOCK', card, user.id);
    this.emit(CARD_EVENT_NAMES.UNLOCKED, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, performedBy: user.id, status: card.status });
    return this.mapper.toCardResponse(card);
  }

  async cancelCard(user: AuthenticatedUser, cardId: string, reason?: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    if (TERMINAL_CARD_STATUSES.has(card.status)) {
      return this.mapper.toCardResponse(card);
    }
    card.status = CardStatus.CANCELLED;
    card.closedAt = new Date();
    await this.repository.updateCard(card);
    this.audit('CANCEL', card, user.id, reason ? { reason } : undefined);
    this.emit(CARD_EVENT_NAMES.CANCELLED, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, performedBy: user.id, status: card.status, reason });
    return this.mapper.toCardResponse(card);
  }

  async replaceCard(user: AuthenticatedUser, cardId: string): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    card.status = CardStatus.REISSUED;
    card.closedAt = new Date();
    await this.repository.updateCard(card);

    const replacement = await this.issueCard(user, {
      accountId: card.accountId,
      type: card.type,
      network: card.network,
      cardholderName: card.cardholderName,
      nickname: card.nickname,
      spendingCategory: card.spendingCategory,
      spendingControls: card.spendingControls,
      contactlessEnabled: card.contactlessEnabled,
      onlineEnabled: card.onlineEnabled,
      internationalEnabled: card.internationalEnabled,
      atmEnabled: card.atmEnabled,
    });

    const replacementCard = await this.findCardOrThrow(replacement.id);
    replacementCard.replacesCardId = card.id;
    await this.repository.updateCard(replacementCard);
    card.replacementCardId = replacementCard.id;
    await this.repository.updateCard(card);

    this.audit('REISSUE', card, user.id, { replacementCardId: replacementCard.id });
    this.emit(CARD_EVENT_NAMES.REISSUED, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, performedBy: user.id, status: card.status, metadata: { replacementCardId: replacementCard.id } });
    return this.mapper.toCardResponse(replacementCard);
  }

  async changePin(user: AuthenticatedUser, cardId: string, dto: ChangePinDto): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    if (!this.validator.validatePin(dto.pin)) {
      throw new CardValidationException('PIN must be 4 to 12 digits');
    }
    card.pinHash = this.validator.hashValue(dto.pin);
    card.pinSetAt = new Date();
    await this.repository.updateCard(card);
    this.audit('PIN_CHANGE', card, user.id);
    return this.mapper.toCardResponse(card);
  }

  async regenerateCvv(user: AuthenticatedUser, cardId: string, _dto: RegenerateCvvDto): Promise<CardResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    if (card.type === CardType.PHYSICAL_DEBIT) {
      throw new CardPolicyViolationException('CVV regeneration is only available for virtual cards');
    }
    const cvv = this.validator.generateCvv();
    card.cvvHash = this.validator.hashValue(cvv);
    await this.repository.updateCard(card);
    this.audit('CVV_REGENERATE', card, user.id);
    return this.mapper.toCardResponse(card);
  }

  async authorizeTransaction(user: AuthenticatedUser, cardId: string, dto: AuthorizeCardTransactionDto): Promise<CardTransactionResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    const account = await this.accountService.findById(card.accountId);
    if (!account) {
      throw new CardValidationException(`Account ${card.accountId} not found`);
    }

    const recentDaySpend = await this.repository.sumTransactionsByCardIdAndDateRange(card.id, this.startOfDay(), new Date());
    const recentMonthSpend = await this.repository.sumTransactionsByCardIdAndDateRange(card.id, this.startOfMonth(), new Date());
    const policyResult = this.policy.canAuthorizeTransaction(card, dto.amount, {
      isOnline: dto.isOnline,
      isInternational: dto.isInternational,
      isContactless: dto.isContactless,
      merchantName: dto.merchantName,
      merchantCountry: dto.merchantCountry,
      accountBalance: account.availableBalance?.toString?.() ?? account.currentBalance?.toString?.() ?? undefined,
      recentDaySpend,
      recentMonthSpend,
    });

    if (!policyResult.allowed) {
      const declineReason = this.pickDeclineReason(policyResult.violations);
      return this.recordDeclinedTransaction(card, dto, declineReason, user.id);
    }

    const hold = await this.ledgerService.createHold({
      accountId: card.accountId,
      amount: this.toMinorUnits(dto.amount),
      currency: dto.currency ?? 'USD',
      reason: `Card authorization for ${dto.merchantName ?? card.nickname ?? card.maskedNumber}`,
      relatedTransactionId: undefined,
    } as CreateHoldDto);

    const transaction = await this.transactionService.createTransaction({
      type: TransactionType.CARD_AUTHORIZATION,
      accountId: card.accountId,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      description: dto.merchantName ?? 'Card authorization',
      idempotencyKey: dto.idempotencyKey,
      createdBy: user.id,
      reference: this.validator.generateToken('cardauth'),
      metadata: {
        cardId: card.id,
        cardType: card.type,
        cardTransactionType: dto.type,
        merchantName: dto.merchantName ?? '',
        holdId: hold.id,
        authorizationCode: this.validator.generateToken('auth').slice(-10),
      },
    });

    const cardTransaction: CardTransactionRecord = {
      id: randomUUID(),
      cardId: card.id,
      transactionId: transaction.id,
      holdId: hold.id,
      type: dto.type,
      status: CardTransactionStatus.AUTHORIZED,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      merchantName: dto.merchantName,
      merchantCategoryCode: dto.merchantCategoryCode,
      merchantCity: dto.merchantCity,
      merchantCountry: dto.merchantCountry,
      isOnline: dto.isOnline ?? false,
      isInternational: dto.isInternational ?? false,
      isContactless: dto.isContactless ?? false,
      authorizationCode: String(transaction.metadata?.authorizationCode ?? this.validator.generateToken('auth').slice(-10)),
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.saveTransaction(cardTransaction);
    this.audit('AUTHORIZATION', card, user.id, { transactionId: transaction.id, holdId: hold.id });
    this.emit(CARD_EVENT_NAMES.AUTHORIZATION, {
      cardId: card.id,
      accountId: card.accountId,
      customerId: card.customerId,
      cardTransactionId: cardTransaction.id,
      transactionId: transaction.id,
      holdId: hold.id,
      type: cardTransaction.type,
      status: cardTransaction.status,
      amount: cardTransaction.amount,
      currency: cardTransaction.currency,
      merchantName: cardTransaction.merchantName,
      authorizationCode: cardTransaction.authorizationCode,
      performedBy: user.id,
    });

    return this.mapper.toCardTransactionResponse(cardTransaction);
  }

  async captureTransaction(user: AuthenticatedUser, cardTransactionId: string): Promise<CardTransactionResponseDto> {
    const cardTransaction = await this.findTransactionOrThrow(cardTransactionId);
    const card = await this.findCardOrThrow(cardTransaction.cardId);
    await this.ensureOwnership(user, card);
    const policyResult = this.policy.canCaptureTransaction(cardTransaction);
    if (!policyResult.allowed) {
      throw new CardPolicyViolationException(policyResult.violations.join('; '));
    }

    const transaction = await this.transactionService.createTransaction({
      type: TransactionType.CARD_CAPTURE,
      accountId: card.accountId,
      amount: cardTransaction.amount,
      currency: cardTransaction.currency,
      description: cardTransaction.merchantName ?? 'Card capture',
      createdBy: user.id,
      reference: this.validator.generateToken('cardcap'),
      metadata: {
        cardId: card.id,
        cardTransactionId: cardTransaction.id,
        holdId: cardTransaction.holdId ?? '',
      },
    });

    if (cardTransaction.holdId) {
      await this.ledgerService.releaseHold(cardTransaction.holdId, { reason: 'Card capture settlement' } as ReleaseHoldDto);
    }

    cardTransaction.transactionId = transaction.id;
    cardTransaction.status = CardTransactionStatus.CAPTURED;
    cardTransaction.settledAt = new Date();
    await this.repository.updateTransaction(cardTransaction);
    this.audit('CAPTURE', card, user.id, { transactionId: transaction.id });
    this.emit(CARD_EVENT_NAMES.CAPTURED, {
      cardId: card.id,
      accountId: card.accountId,
      customerId: card.customerId,
      cardTransactionId: cardTransaction.id,
      transactionId: transaction.id,
      holdId: cardTransaction.holdId,
      type: cardTransaction.type,
      status: cardTransaction.status,
      amount: cardTransaction.amount,
      currency: cardTransaction.currency,
      merchantName: cardTransaction.merchantName,
      authorizationCode: cardTransaction.authorizationCode,
      performedBy: user.id,
    });
    return this.mapper.toCardTransactionResponse(cardTransaction);
  }

  async completeTransaction(user: AuthenticatedUser, cardTransactionId: string): Promise<CardTransactionResponseDto> {
    const cardTransaction = await this.findTransactionOrThrow(cardTransactionId);
    const card = await this.findCardOrThrow(cardTransaction.cardId);
    await this.ensureOwnership(user, card);
    cardTransaction.status = CardTransactionStatus.COMPLETED;
    await this.repository.updateTransaction(cardTransaction);
    this.audit('COMPLETION', card, user.id, { transactionId: cardTransaction.transactionId ?? '' });
    this.emit(CARD_EVENT_NAMES.COMPLETED, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, cardTransactionId: cardTransaction.id, transactionId: cardTransaction.transactionId, holdId: cardTransaction.holdId, type: cardTransaction.type, status: cardTransaction.status, amount: cardTransaction.amount, currency: cardTransaction.currency, merchantName: cardTransaction.merchantName, authorizationCode: cardTransaction.authorizationCode, performedBy: user.id });
    return this.mapper.toCardTransactionResponse(cardTransaction);
  }

  async refundTransaction(user: AuthenticatedUser, cardTransactionId: string, dto: RefundCardTransactionDto): Promise<CardTransactionResponseDto> {
    const cardTransaction = await this.findTransactionOrThrow(cardTransactionId);
    const card = await this.findCardOrThrow(cardTransaction.cardId);
    await this.ensureOwnership(user, card);
    const policyResult = this.policy.canRefundTransaction(cardTransaction);
    if (!policyResult.allowed) {
      throw new CardPolicyViolationException(policyResult.violations.join('; '));
    }

    const transaction = await this.transactionService.createTransaction({
      type: TransactionType.CARD_REFUND,
      accountId: card.accountId,
      amount: dto.amount,
      currency: dto.currency ?? cardTransaction.currency,
      description: dto.reason ?? `Refund for ${cardTransaction.merchantName ?? 'card transaction'}`,
      createdBy: user.id,
      reference: this.validator.generateToken('cardref'),
      metadata: {
        cardId: card.id,
        cardTransactionId: cardTransaction.id,
      },
    });

    cardTransaction.transactionId = transaction.id;
    cardTransaction.status = CardTransactionStatus.REFUNDED;
    await this.repository.updateTransaction(cardTransaction);
    this.audit('REFUND', card, user.id, { transactionId: transaction.id });
    this.emit(CARD_EVENT_NAMES.REFUNDED, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, cardTransactionId: cardTransaction.id, transactionId: transaction.id, holdId: cardTransaction.holdId, type: cardTransaction.type, status: cardTransaction.status, amount: cardTransaction.amount, currency: cardTransaction.currency, merchantName: cardTransaction.merchantName, authorizationCode: cardTransaction.authorizationCode, performedBy: user.id });
    return this.mapper.toCardTransactionResponse(cardTransaction);
  }

  async reverseTransaction(user: AuthenticatedUser, cardTransactionId: string, dto: ReverseCardTransactionDto): Promise<CardTransactionResponseDto> {
    const cardTransaction = await this.findTransactionOrThrow(cardTransactionId);
    const card = await this.findCardOrThrow(cardTransaction.cardId);
    await this.ensureOwnership(user, card);
    const policyResult = this.policy.canReverseTransaction(cardTransaction);
    if (!policyResult.allowed) {
      throw new CardPolicyViolationException(policyResult.violations.join('; '));
    }

    if (cardTransaction.transactionId) {
      await this.transactionService.reverseTransaction(cardTransaction.transactionId, dto.reason ?? 'Card reversal', user.id);
    }

    if (cardTransaction.holdId && cardTransaction.status === CardTransactionStatus.AUTHORIZED) {
      await this.ledgerService.releaseHold(cardTransaction.holdId, { reason: dto.reason ?? 'Card reversal' } as ReleaseHoldDto);
    }

    cardTransaction.status = CardTransactionStatus.REVERSED;
    await this.repository.updateTransaction(cardTransaction);
    this.audit('REVERSAL', card, user.id, { transactionId: cardTransaction.transactionId ?? '' });
    this.emit(CARD_EVENT_NAMES.REVERSED, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, cardTransactionId: cardTransaction.id, transactionId: cardTransaction.transactionId, holdId: cardTransaction.holdId, type: cardTransaction.type, status: cardTransaction.status, amount: cardTransaction.amount, currency: cardTransaction.currency, merchantName: cardTransaction.merchantName, authorizationCode: cardTransaction.authorizationCode, performedBy: user.id });
    return this.mapper.toCardTransactionResponse(cardTransaction);
  }

  async chargebackTransaction(user: AuthenticatedUser, cardTransactionId: string, reason?: string): Promise<CardTransactionResponseDto> {
    const cardTransaction = await this.findTransactionOrThrow(cardTransactionId);
    const card = await this.findCardOrThrow(cardTransaction.cardId);
    await this.ensureOwnership(user, card);
    cardTransaction.status = CardTransactionStatus.CHARGEDBACK;
    cardTransaction.declineReason = CardDeclineReason.OTHER;
    cardTransaction.metadata = {
      ...(cardTransaction.metadata ?? {}),
      chargebackReason: reason ?? 'Card chargeback',
    };
    await this.repository.updateTransaction(cardTransaction);
    this.audit('CHARGEBACK', card, user.id, reason ? { reason } : undefined);
    this.emit(CARD_EVENT_NAMES.CHARGEBACK, { cardId: card.id, accountId: card.accountId, customerId: card.customerId, cardTransactionId: cardTransaction.id, transactionId: cardTransaction.transactionId, holdId: cardTransaction.holdId, type: cardTransaction.type, status: cardTransaction.status, amount: cardTransaction.amount, currency: cardTransaction.currency, merchantName: cardTransaction.merchantName, authorizationCode: cardTransaction.authorizationCode, performedBy: user.id });
    return this.mapper.toCardTransactionResponse(cardTransaction);
  }

  async searchCardTransactions(user: AuthenticatedUser, dto: SearchCardTransactionsDto): Promise<CardTransactionSearchResponseDto> {
    const result = await this.repository.searchTransactions({
      cardId: dto.cardId,
      type: dto.type,
      status: dto.status,
      merchantName: dto.merchantName,
      transactionId: dto.transactionId,
      accountId: dto.accountId,
      customerId: dto.customerId ?? user.id,
      fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
      toDate: dto.toDate ? new Date(dto.toDate) : undefined,
      limit: Number(dto.limit ?? 50),
      cursor: dto.cursor,
    });

    return this.mapper.toCardTransactionSearchResponse(result.items, result.totalCount, Number(dto.limit ?? 50), result.nextCursor);
  }

  async listCardTransactions(user: AuthenticatedUser, cardId: string, dto: SearchCardTransactionsDto): Promise<CardTransactionSearchResponseDto> {
    const card = await this.findCardOrThrow(cardId);
    await this.ensureOwnership(user, card);
    return this.searchCardTransactions(user, { ...dto, cardId });
  }

  private async findCardOrThrow(cardId: string): Promise<CardRecord> {
    const card = await this.repository.findCardById(cardId);
    if (!card) {
      throw new CardNotFoundException(cardId);
    }
    return card;
  }

  private async findTransactionOrThrow(transactionId: string): Promise<CardTransactionRecord> {
    const transaction = await this.repository.findTransactionById(transactionId);
    if (!transaction) {
      throw new CardTransactionNotFoundException(transactionId);
    }
    return transaction;
  }

  private async ensureOwnership(user: AuthenticatedUser, card: CardRecord): Promise<void> {
    const isOwner = card.customerId === user.id || (await this.accountService.isAccountHolder(card.accountId, user.id));
    if (!isOwner) {
      throw new CardPolicyViolationException('You do not have permission to access this card');
    }
  }

  private ensureTransition(card: CardRecord, allowedStatuses: CardStatus[]): void {
    if (!allowedStatuses.includes(card.status)) {
      throw new CardPolicyViolationException(`Card ${card.id} cannot transition from ${card.status}`);
    }
  }

  private recordDeclinedTransaction(card: CardRecord, dto: AuthorizeCardTransactionDto, declineReason: CardDeclineReason, performedBy: string): CardTransactionResponseDto {
    const transaction: CardTransactionRecord = {
      id: randomUUID(),
      cardId: card.id,
      type: dto.type,
      status: CardTransactionStatus.DECLINED,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      merchantName: dto.merchantName,
      merchantCategoryCode: dto.merchantCategoryCode,
      merchantCity: dto.merchantCity,
      merchantCountry: dto.merchantCountry,
      isOnline: dto.isOnline ?? false,
      isInternational: dto.isInternational ?? false,
      isContactless: dto.isContactless ?? false,
      declineReason,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    void this.repository.saveTransaction(transaction);
    this.audit('DECLINE', card, performedBy, { reason: declineReason });
    this.emit(CARD_EVENT_NAMES.AUTHORIZATION, {
      cardId: card.id,
      accountId: card.accountId,
      customerId: card.customerId,
      cardTransactionId: transaction.id,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      merchantName: transaction.merchantName,
      performedBy,
    });
    return this.mapper.toCardTransactionResponse(transaction);
  }

  private emit(eventName: string, payload: CardEventBase & Record<string, unknown>): void {
    this.eventEmitter.emit(eventName, payload);
  }

  private audit(action: string, card: CardRecord, performedBy: string, details?: Record<string, string>): void {
    this.auditLog.push({
      cardId: card.id,
      action,
      performedBy,
      timestamp: new Date(),
      details,
    });
  }

  private toMinorUnits(amount: string): string {
    return String(Math.round(Number(amount) * 100));
  }

  private startOfDay(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  private startOfMonth(): Date {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now;
  }

  private calculateExpiryDate(): { month: number; year: number } {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() + 3 };
  }

  private pickDeclineReason(violations: string[]): CardDeclineReason {
    const joined = violations.join(' ').toLowerCase();
    if (joined.includes('balance')) {
      return CardDeclineReason.INSUFFICIENT_FUNDS;
    }
    if (joined.includes('limit')) {
      return CardDeclineReason.EXCEEDS_LIMIT;
    }
    if (joined.includes('merchant')) {
      return CardDeclineReason.BLOCKED_MERCHANT;
    }
    if (joined.includes('international')) {
      return CardDeclineReason.SUSPICIOUS_ACTIVITY;
    }
    return CardDeclineReason.OTHER;
  }
}
