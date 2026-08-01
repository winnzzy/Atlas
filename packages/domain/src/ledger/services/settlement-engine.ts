import { Settlement } from '../entities/settlement';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { JournalId } from '../value-objects/journal-id';
import { Money } from '../value-objects/money';
import { SettlementStatus } from '../enums';
import { SettlementCompleted } from '../events';
import { LedgerRepository, EventBus } from './interfaces';

export interface CreateSettlementRequest {
  sourceAccountId: LedgerAccountId;
  destinationAccountId: LedgerAccountId;
  amount: Money;
  journalId: JournalId;
  description?: string;
}

/**
 * SettlementEngine - Domain service for managing fund settlements between accounts.
 * Handles creating and completing settlements.
 */
export class SettlementEngine {
  constructor(
    private readonly repository: LedgerRepository,
    private readonly eventBus: EventBus,
  ) {}

  async createSettlement(request: CreateSettlementRequest): Promise<Settlement> {
    const settlement = Settlement.create({
      sourceAccountId: request.sourceAccountId,
      destinationAccountId: request.destinationAccountId,
      amount: request.amount,
      journalId: request.journalId,
      description: request.description,
    });

    await this.repository.saveSettlement(settlement);
    return settlement;
  }

  async completeSettlement(settlementId: string): Promise<Settlement> {
    const settlement = await this.repository.findSettlementById(settlementId);
    if (!settlement) {
      throw new Error(`Settlement not found: ${settlementId}`);
    }

    settlement.complete();
    await this.repository.updateSettlement(settlement);

    this.eventBus.publish(
      new SettlementCompleted(
        settlement.id,
        settlement.id,
        settlement.journalId,
        settlement.sourceAccountId,
        settlement.destinationAccountId,
        settlement.amount,
      ),
    );

    return settlement;
  }

  async failSettlement(settlementId: string, reason?: string): Promise<Settlement> {
    const settlement = await this.repository.findSettlementById(settlementId);
    if (!settlement) {
      throw new Error(`Settlement not found: ${settlementId}`);
    }

    settlement.fail(reason ?? 'Settlement failed');
    await this.repository.updateSettlement(settlement);
    return settlement;
  }

  async getSettlement(settlementId: string): Promise<Settlement | null> {
    return this.repository.findSettlementById(settlementId);
  }
}