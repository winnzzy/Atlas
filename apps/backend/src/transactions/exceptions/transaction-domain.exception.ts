import { HttpException, HttpStatus } from '@nestjs/common';

export class TransactionNotFoundException extends HttpException {
  constructor(transactionId: string) {
    super(`Transaction ${transactionId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class TransactionAuthorizationException extends HttpException {
  constructor(reason: string) {
    super(`Transaction authorization failed: ${reason}`, HttpStatus.FORBIDDEN);
  }
}

export class TransactionValidationException extends HttpException {
  constructor(reason: string) {
    super(`Transaction validation failed: ${reason}`, HttpStatus.BAD_REQUEST);
  }
}

export class DuplicateReferenceException extends HttpException {
  constructor(reference: string) {
    super(`Duplicate reference number: ${reference}`, HttpStatus.CONFLICT);
  }
}

export class DuplicateIdempotencyKeyException extends HttpException {
  constructor(idempotencyKey: string) {
    super(`Duplicate idempotency key: ${idempotencyKey}`, HttpStatus.CONFLICT);
  }
}

export class InsufficientFundsException extends HttpException {
  constructor(available: string, requested: string) {
    super(
      `Insufficient funds: available ${available}, requested ${requested}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class AccountNotActiveException extends HttpException {
  constructor(accountId: string, status: string) {
    super(
      `Account ${accountId} is not active (status: ${status})`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class TransactionAlreadySettledException extends HttpException {
  constructor(transactionId: string) {
    super(`Transaction ${transactionId} is already settled`, HttpStatus.CONFLICT);
  }
}

export class TransactionNotReversibleException extends HttpException {
  constructor(transactionId: string, status: string) {
    super(
      `Transaction ${transactionId} cannot be reversed (status: ${status})`,
      HttpStatus.CONFLICT,
    );
  }
}

export class CurrencyMismatchException extends HttpException {
  constructor(expected: string, actual: string) {
    super(`Currency mismatch: expected ${expected}, got ${actual}`, HttpStatus.BAD_REQUEST);
  }
}

export class DailyLimitExceededException extends HttpException {
  constructor(limit: string, attempted: string) {
    super(
      `Daily limit exceeded: limit ${limit}, attempted ${attempted}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class TransactionPolicyViolationException extends HttpException {
  constructor(violation: string) {
    super(`Policy violation: ${violation}`, HttpStatus.FORBIDDEN);
  }
}