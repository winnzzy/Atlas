import { ConflictException, BadRequestException } from '@nestjs/common';

export class LedgerDomainException extends BadRequestException {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ message, code: 'LEDGER_DOMAIN_ERROR', ...details });
  }
}

export class UnbalancedEntryException extends LedgerDomainException {
  constructor(totalDebits: string, totalCredits: string) {
    super('Journal entry is unbalanced: total debits must equal total credits', {
      totalDebits,
      totalCredits,
    });
  }
}

export class DuplicatePostingException extends ConflictException {
  constructor(idempotencyKey: string) {
    super(`Duplicate posting detected for idempotency key: ${idempotencyKey}`);
  }
}

export class InvalidPostingTypeException extends LedgerDomainException {
  constructor(postingType: string) {
    super(`Invalid posting type: ${postingType}`);
  }
}

export class InsufficientFundsException extends LedgerDomainException {
  constructor(accountId: string, available: string, requested: string) {
    super('Insufficient funds for this posting', {
      accountId,
      availableBalance: available,
      requestedAmount: requested,
    });
  }
}

export class HoldNotFoundException extends LedgerDomainException {
  constructor(holdId: string) {
    super(`Hold not found: ${holdId}`);
  }
}

export class HoldAlreadyReleasedException extends LedgerDomainException {
  constructor(holdId: string) {
    super(`Hold already released: ${holdId}`);
  }
}

export class ReversalNotAllowedException extends LedgerDomainException {
  constructor(transactionId: string, reason: string) {
    super(`Reversal not allowed for transaction ${transactionId}: ${reason}`);
  }
}

export class AccountNotFoundException extends LedgerDomainException {
  constructor(accountId: string) {
    super(`Account not found: ${accountId}`);
  }
}

export class AccountNotActiveException extends LedgerDomainException {
  constructor(accountId: string, status: string) {
    super(`Account ${accountId} is not active (status: ${status})`);
  }
}

export class ReconciliationVarianceException extends LedgerDomainException {
  constructor(accountId: string, expected: string, actual: string, variance: string) {
    super('Reconciliation variance detected', {
      accountId,
      expectedBalance: expected,
      actualBalance: actual,
      variance,
    });
  }
}
