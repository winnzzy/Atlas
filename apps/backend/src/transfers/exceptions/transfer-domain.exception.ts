import { HttpException, HttpStatus } from '@nestjs/common';

export class TransferNotFoundException extends HttpException {
  constructor(transferId: string) {
    super(`Transfer ${transferId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class TransferValidationException extends HttpException {
  constructor(reason: string) {
    super(`Transfer validation failed: ${reason}`, HttpStatus.BAD_REQUEST);
  }
}

export class TransferPolicyViolationException extends HttpException {
  constructor(reason: string) {
    super(`Transfer policy violation: ${reason}`, HttpStatus.FORBIDDEN);
  }
}

export class DuplicateTransferReferenceException extends HttpException {
  constructor(reference: string) {
    super(`Duplicate transfer reference: ${reference}`, HttpStatus.CONFLICT);
  }
}

export class DuplicateTransferIdempotencyKeyException extends HttpException {
  constructor(idempotencyKey: string) {
    super(`Duplicate transfer idempotency key: ${idempotencyKey}`, HttpStatus.CONFLICT);
  }
}

export class BeneficiaryNotFoundException extends HttpException {
  constructor(beneficiaryId: string) {
    super(`Beneficiary ${beneficiaryId} not found`, HttpStatus.NOT_FOUND);
  }
}
