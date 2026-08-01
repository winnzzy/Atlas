import { Posting } from '../entities/posting';
import { Journal } from '../entities/journal';
import { Money } from '../value-objects/money';
import { LedgerAccountId } from '../value-objects/ledger-account-id';
import { BalanceType } from '../enums';
import { LedgerRepository } from './interfaces';
import { ValidationResult } from './journal-validator';

/**
 * LedgerValidator - Validates ledger-level business rules.
 * Ensures balance sufficiency, currency consistency, and account validity.
 */
export class LedgerValidator {
  constructor(private readonly repository: LedgerRepository) {}

  async validateDebit(
    accountId: LedgerAccountId,
    amount: Money,
  ): Promise<ValidationResult> {
    return this.validateSufficientBalance(accountId, amount, BalanceType.LEDGER);
  }

  async validateSufficientBalance(
    accountId: LedgerAccountId,
    amount: Money,
    balanceType: BalanceType = BalanceType.AVAILABLE,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const accountBalances = await this.repository.getAccountBalances(accountId);

    if (!accountBalances) {
      errors.push(`Account ${accountId.value} not found in ledger`);
      return { valid: false, errors };
    }

    const balance = accountBalances.balances.get(balanceType);
    if (!balance) {
      errors.push(`Balance type ${balanceType} not found for account ${accountId.value}`);
      return { valid: false, errors };
    }

    if (balance.lessThan(amount)) {
      errors.push(
        `Insufficient balance for account ${accountId.value} (${balanceType}): ` +
          `available ${balance.toString()}, requested ${amount.toString()}`,
      );
    }

    return { valid: errors.length === 0, errors };
  }

  validateCurrencyMatch(money1: Money, money2: Money): ValidationResult {
    const errors: string[] = [];

    if (money1.currency !== money2.currency) {
      errors.push(
        `Currency mismatch: ${money1.currency} vs ${money2.currency}`,
      );
    }

    return { valid: errors.length === 0, errors };
  }

  async validatePostingBatch(postings: Posting[]): Promise<ValidationResult> {
    const errors: string[] = [];

    if (postings.length === 0) {
      errors.push('Posting batch cannot be empty');
      return { valid: false, errors };
    }

    // Check all postings have same currency
    const currencies = new Set(postings.map((p) => p.amount.currency));
    if (currencies.size > 1) {
      errors.push('All postings in a batch must have the same currency');
    }

    // Check for duplicate posting IDs
    const ids = new Set<string>();
    for (const posting of postings) {
      if (ids.has(posting.id.value)) {
        errors.push(`Duplicate posting ID in batch: ${posting.id.value}`);
      }
      ids.add(posting.id.value);
    }

    // Validate double-entry: total debits == total credits
    const firstPosting = postings[0]!;
    const currency = firstPosting.amount.currency;
    let totalDebits = Money.zero(currency);
    let totalCredits = Money.zero(currency);

    for (const posting of postings) {
      if (posting.isDebit) {
        totalDebits = totalDebits.add(posting.amount);
      } else {
        totalCredits = totalCredits.add(posting.amount);
      }
    }

    if (!totalDebits.equals(totalCredits)) {
      errors.push(
        `Posting batch is not balanced: total debits (${totalDebits.toString()}) != total credits (${totalCredits.toString()})`,
      );
    }

    return { valid: errors.length === 0, errors };
  }
}