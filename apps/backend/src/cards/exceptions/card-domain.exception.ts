import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class CardDomainException extends BadRequestException {}

export class CardNotFoundException extends NotFoundException {
  constructor(cardId: string) {
    super(`Card ${cardId} not found`);
  }
}

export class CardTransactionNotFoundException extends NotFoundException {
  constructor(transactionId: string) {
    super(`Card transaction ${transactionId} not found`);
  }
}

export class CardValidationException extends CardDomainException {}

export class CardPolicyViolationException extends ForbiddenException {
  constructor(message: string) {
    super(message);
  }
}
