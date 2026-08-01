import { Money } from '../value-objects/money';
import { BalanceType } from '../enums';

export interface BalanceBreakdown {
  ledger: Money;
  current: Money;
  available: Money;
  pending: Money;
  held: Money;
  reserved: Money;
}

/**
 * BalanceCalculator - Pure domain service for computing balance breakdowns.
 * Calculates all six balance types from ledger, pending, held, and reserved amounts.
 */
export class BalanceCalculator {
  /**
   * Calculate available balance from component balances.
   * Available = Ledger - Held - Reserved + Pending (pending credits)
   */
  calculateAvailableBalance(
    ledgerBalance: Money,
    heldBalance: Money,
    reservedBalance: Money,
  ): Money {
    return ledgerBalance.subtract(heldBalance).subtract(reservedBalance);
  }

  /**
   * Calculate current balance.
   * Current = Ledger + Pending (net pending)
   */
  calculateCurrentBalance(
    ledgerBalance: Money,
    pendingDebits: Money,
    pendingCredits: Money,
  ): Money {
    return ledgerBalance.add(pendingCredits).subtract(pendingDebits);
  }

  /**
   * Build a full balance breakdown from raw components.
   */
  calculateBreakdown(
    ledgerBalance: Money,
    pendingDebits: Money,
    pendingCredits: Money,
    heldBalance: Money,
    reservedBalance: Money,
  ): BalanceBreakdown {
    const current = this.calculateCurrentBalance(
      ledgerBalance,
      pendingDebits,
      pendingCredits,
    );
    const available = this.calculateAvailableBalance(
      ledgerBalance,
      heldBalance,
      reservedBalance,
    );
    const pending = pendingCredits.subtract(pendingDebits);

    return {
      ledger: ledgerBalance,
      current,
      available,
      pending,
      held: heldBalance,
      reserved: reservedBalance,
    };
  }

  /**
   * Apply a debit to the appropriate balance types.
   */
  applyDebit(
    balanceType: BalanceType,
    currentBalance: Money,
    amount: Money,
  ): Money {
    return currentBalance.subtract(amount);
  }

  /**
   * Apply a credit to the appropriate balance types.
   */
  applyCredit(
    balanceType: BalanceType,
    currentBalance: Money,
    amount: Money,
  ): Money {
    return currentBalance.add(amount);
  }
}