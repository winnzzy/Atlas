import { Journal } from '../entities/journal';
import { Posting } from '../entities/posting';
import { LedgerRepository } from './interfaces';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * JournalValidator - Validates journal entries before posting.
 * Enforces double-entry rules, currency consistency, and business rules.
 */
export class JournalValidator {
  constructor(private readonly repository: LedgerRepository) {}

  validate(journal: Journal): ValidationResult {
    const errors: string[] = [];

    if (journal.entries.length === 0) {
      errors.push('Journal must contain at least one entry');
      return { valid: false, errors };
    }

    if (!journal.isBalanced) {
      errors.push(`Journal is not balanced: total debits (${journal.totalDebits}) != total credits (${journal.totalCredits})`);
    }

    // Check currency consistency across all entries
    const currencies = new Set(journal.entries.map((e) => e.amount.currency));
    if (currencies.size > 1) {
      errors.push('All entries in a journal must have the same currency');
    }

    if (!journal.isDraft) {
      errors.push(`Cannot validate journal in ${journal.status} status`);
    }

    for (const entry of journal.entries) {
      if (entry.amount.isZero) {
        errors.push(`Journal ${journal.id.value} contains a zero-amount entry`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async validatePosting(posting: Posting): Promise<ValidationResult> {
    const errors: string[] = [];

    if (posting.amount.isZero) {
      errors.push('Posting amount cannot be zero');
    }

    const exists = await this.repository.checkPostingIdExists(posting.id);
    if (exists) {
      errors.push(`Duplicate posting ID: ${posting.id.value}`);
    }

    return { valid: errors.length === 0, errors };
  }
}