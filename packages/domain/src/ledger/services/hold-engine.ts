import { Hold } from '../entities/hold';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { Money } from '../value-objects/money';
import { BalanceType, HoldStatus } from '../enums';
import { HoldCreated, HoldReleased, BalanceChanged } from '../events';
import { LedgerRepository, EventBus } from './interfaces';

export interface CreateHoldRequest {
  accountId: LedgerAccountId;
  amount: Money;
  reason: string;
  expiresInMs?: number;
}

export interface ReleaseHoldRequest {
  holdId: string;
  amount?: Money;
}

/**
 * HoldEngine - Domain service for managing holds (fund reservations).
 * Handles creation, release, partial release, and automatic expiration of holds.
 */
export class HoldEngine {
  constructor(
    private readonly repository: LedgerRepository,
    private readonly eventBus: EventBus,
  ) {}

  async createHold(accountId: LedgerAccountId, amount: Money, reason: string, expiresInMs?: number): Promise<Hold>;
  async createHold(request: CreateHoldRequest): Promise<Hold>;
  async createHold(
    accountOrRequest: LedgerAccountId | CreateHoldRequest,
    amount?: Money,
    reason?: string,
    expiresInMs?: number,
  ): Promise<Hold> {
    const request = accountOrRequest instanceof LedgerAccountId
      ? { accountId: accountOrRequest, amount: amount as Money, reason: reason as string, expiresInMs }
      : accountOrRequest;

    const hold = Hold.create({
      accountId: request.accountId,
      amount: request.amount,
      reason: request.reason,
      expiresInMs: request.expiresInMs,
    });

    await this.repository.saveHold(hold);

    this.eventBus.publish(
      new HoldCreated(
        hold.id,
        hold.id,
        hold.accountId,
        hold.amount,
        hold.expiresAt,
      ),
    );

    this.eventBus.publish(
      new BalanceChanged(
        hold.accountId.value,
        hold.accountId,
        BalanceType.HELD,
        Money.zero(hold.amount.currency),
        hold.amount,
      ),
    );

    return hold;
  }

  async releaseHold(holdId: string, amount?: Money): Promise<Hold>;
  async releaseHold(request: ReleaseHoldRequest): Promise<Hold>;
  async releaseHold(
    holdOrRequest: string | ReleaseHoldRequest,
    amount?: Money,
  ): Promise<Hold> {
    const request = typeof holdOrRequest === 'string'
      ? { holdId: holdOrRequest, amount }
      : holdOrRequest;

    const hold = await this.repository.findHoldById(request.holdId);
    if (!hold) {
      throw new Error(`Hold not found: ${request.holdId}`);
    }

    const previousAmount = hold.amount;
    hold.release(request.amount);
    await this.repository.updateHold(hold);

    this.eventBus.publish(
      new HoldReleased(
        hold.id,
        hold.id,
        hold.accountId,
        request.amount ?? previousAmount,
        hold.status === HoldStatus.RELEASED,
      ),
    );

    this.eventBus.publish(
      new BalanceChanged(
        hold.accountId.value,
        hold.accountId,
        BalanceType.HELD,
        previousAmount,
        hold.amount,
      ),
    );

    return hold;
  }

  async expireHold(holdId: string): Promise<Hold> {
    const hold = await this.repository.findHoldById(holdId);
    if (!hold) {
      throw new Error(`Hold not found: ${holdId}`);
    }

    const previousAmount = hold.amount;
    hold.expire();
    await this.repository.updateHold(hold);

    this.eventBus.publish(
      new HoldReleased(
        hold.id,
        hold.id,
        hold.accountId,
        hold.amount,
        true,
      ),
    );

    this.eventBus.publish(
      new BalanceChanged(
        hold.accountId.value,
        hold.accountId,
        BalanceType.HELD,
        previousAmount,
        Money.zero(hold.amount.currency),
      ),
    );

    return hold;
  }

  async expireHoldsForAccount(accountId: LedgerAccountId): Promise<Hold[]> {
    const activeHolds = await this.repository.findActiveHoldsByAccountId(accountId);
    const expiredHolds: Hold[] = [];
    const now = new Date();

    for (const hold of activeHolds) {
      if (hold.expiresAt <= now) {
        const expired = await this.expireHold(hold.id);
        expiredHolds.push(expired);
      }
    }

    return expiredHolds;
  }

  async getHold(holdId: string): Promise<Hold | null> {
    return this.repository.findHoldById(holdId);
  }

  async getHoldsByAccount(accountId: LedgerAccountId): Promise<Hold[]> {
    return this.repository.findHoldsByAccountId(accountId);
  }

  async getActiveHoldsByAccount(accountId: LedgerAccountId): Promise<Hold[]> {
    return this.repository.findActiveHoldsByAccountId(accountId);
  }
}