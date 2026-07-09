import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class AccountNotFoundException extends NotFoundException {
  constructor(accountId: string) {
    super(`Account not found: ${accountId}`);
    this.name = 'AccountNotFoundException';
  }
}

export class AccountAccessDeniedException extends ForbiddenException {
  constructor(message = 'You do not have access to this account') {
    super(message);
    this.name = 'AccountAccessDeniedException';
  }
}

export class InvalidAccountTransitionException extends BadRequestException {
  constructor(fromState: string, toState: string) {
    super(`Cannot transition account from '${fromState}' to '${toState}'`);
    this.name = 'InvalidAccountTransitionException';
  }
}

export class AccountClosedException extends BadRequestException {
  constructor() {
    super('Cannot perform this operation on a closed account');
    this.name = 'AccountClosedException';
  }
}

export class AccountFrozenException extends BadRequestException {
  constructor(reason?: string) {
    super(reason ?? 'Account is frozen and cannot perform this operation');
    this.name = 'AccountFrozenException';
  }
}

export class AccountLockedException extends BadRequestException {
  constructor() {
    super('Account is locked and cannot perform this operation');
    this.name = 'AccountLockedException';
  }
}

export class InsufficientFundsException extends BadRequestException {
  constructor() {
    super('Insufficient funds for this operation');
    this.name = 'InsufficientFundsException';
  }
}

export class AccountAlreadyExistsException extends BadRequestException {
  constructor(message = 'Account with these details already exists') {
    super(message);
    this.name = 'AccountAlreadyExistsException';
  }
}

export class InvalidAccountOperationException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAccountOperationException';
  }
}
