import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { Money } from '../value-objects/money';
import { BalanceSnapshot } from '../entities/balance-snapshot';
import { BalanceType, ReconciliationType, ReconciliationStatus } from '../enums';
import { ReconciliationCompleted, BalanceChanged } from '../events';
import { LedgerRepository, EventBus, LedgerAccountBalance } from './interfaces';

export interface ReconciliationRequest {
  accountId: LedgerAccountId;
  type: ReconciliationType;
  externalBalance: Money;
  balanceType: BalanceType;
}

export interface ReconciliationResult {
  id: string;
  accountId: LedgerAccountId;
  type: ReconciliationType;
  status: ReconciliationStatus;
  systemBalance: Money;
  externalBalance: Money;
  variance: Money;
  snapshot: BalanceSnapshot;
  reconciledAt: Date;
}

export interface BatchReconciliationRequest {
  entries: ReconciliationRequest[];
  type: ReconciliationType;
}

export interface BatchReconciliationResult {
  results: ReconciliationResult[];
  overallStatus: ReconciliationStatus;
  totalVariance: Money;
}

/**
 * ReconciliationEngine - Domain service for reconciling ledger balances
 * against external sources. Supports daily, monthly, and manual reconciliation.
 */
export class ReconciliationEngine {
  constructor(
    private readonly repository: LedgerRepository,
    private readonly eventBus: EventBus,
  ) {}

  async reconcile(request: ReconciliationRequest): Promise<ReconciliationResult> {
    const accountBalance = await this.repository.getAccountBalances(request.accountId);

    const systemBalance = this.extractBalance(accountBalance, request.balanceType);

    // Calculate absolute variance (always positive)
    let variance: Money;
    const isBalanced = systemBalance.equals(request.externalBalance);
    if (isBalanced) {
      variance = Money.zero(systemBalance.currency);
    } else if (systemBalance.greaterThan(request.externalBalance)) {
      variance = systemBalance.subtract(request.externalBalance);
    } else {
      variance = request.externalBalance.subtract(systemBalance);
    }

    const status = isBalanced
      ? ReconciliationStatus.BALANCED
      : ReconciliationStatus.VARIANCE_DETECTED;

    const snapshot = BalanceSnapshot.create({
      accountId: request.accountId,
      balanceType: request.balanceType,
      balance: systemBalance,
      asOf: new Date(),
    });

    await this.repository.saveBalanceSnapshot(snapshot);

    const reconciliationId = this.generateReconciliationId();

    this.eventBus.publish(
      new ReconciliationCompleted(
        reconciliationId,
        reconciliationId,
        isBalanced,
        1,
        variance,
      ),
    );

    return {
      id: reconciliationId,
      accountId: request.accountId,
      type: request.type,
      status,
      systemBalance,
      externalBalance: request.externalBalance,
      variance,
      snapshot,
      reconciledAt: new Date(),
    };
  }

  async reconcileBatch(batch: BatchReconciliationRequest): Promise<BatchReconciliationResult> {
    const results: ReconciliationResult[] = [];
    let hasVariance = false;

    for (const entry of batch.entries) {
      const result = await this.reconcile(entry);
      results.push(result);
      if (result.status === ReconciliationStatus.VARIANCE_DETECTED) {
        hasVariance = true;
      }
    }

    const totalVariance = this.calculateTotalVariance(results);

    return {
      results,
      overallStatus: hasVariance
        ? ReconciliationStatus.VARIANCE_DETECTED
        : ReconciliationStatus.BALANCED,
      totalVariance,
    };
  }

  async takeBalanceSnapshot(
    accountId: LedgerAccountId,
    balanceType: BalanceType,
  ): Promise<BalanceSnapshot> {
    const accountBalance = await this.repository.getAccountBalances(accountId);
    const balance = this.extractBalance(accountBalance, balanceType);

    const snapshot = BalanceSnapshot.create({
      accountId,
      balanceType,
      balance,
      asOf: new Date(),
    });

    await this.repository.saveBalanceSnapshot(snapshot);

    this.eventBus.publish(
      new BalanceChanged(
        accountId.value,
        accountId,
        balanceType,
        balance,
        balance,
      ),
    );

    return snapshot;
  }

  private extractBalance(
    accountBalance: LedgerAccountBalance | null,
    balanceType: BalanceType,
  ): Money {
    if (!accountBalance) {
      return Money.zero('USD');
    }
    return accountBalance.balances.get(balanceType) ?? Money.zero(accountBalance.currency);
  }

  private calculateTotalVariance(results: ReconciliationResult[]): Money {
    if (results.length === 0) {
      return Money.zero('USD');
    }

    const firstResult = results[0];
    if (!firstResult) {
      return Money.zero('USD');
    }

    let total = Money.zero(firstResult.variance.currency);
    for (const result of results) {
      total = total.add(result.variance);
    }
    return total;
  }

  private generateReconciliationId(): string {
    return `recon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}