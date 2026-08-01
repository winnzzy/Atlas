export enum TransferEventType {
  TRANSFER_CREATED = 'transfer.created',
  TRANSFER_VALIDATED = 'transfer.validated',
  TRANSFER_SUBMITTED = 'transfer.submitted',
  TRANSFER_SENT = 'transfer.sent',
  TRANSFER_SETTLED = 'transfer.settled',
  TRANSFER_COMPLETED = 'transfer.completed',
  TRANSFER_FAILED = 'transfer.failed',
  TRANSFER_RETURNED = 'transfer.returned',
  TRANSFER_CANCELLED = 'transfer.cancelled',
  TRANSFER_REVERSED = 'transfer.reversed',
  BENEFICIARY_CREATED = 'beneficiary.created',
  BENEFICIARY_VERIFIED = 'beneficiary.verified',
}

export abstract class TransferEvent {
  public readonly timestamp = new Date();

  protected constructor(
    public readonly transferId: string,
    public readonly sourceAccountId: string,
  ) {}
}

export class TransferCreatedEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { type: string; amount: string; currency: string; reference?: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferValidatedEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { type: string; beneficiaryId?: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferSubmittedEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { reference?: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferSentEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { settlementReference?: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferSettledEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { settlementReference?: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferCompletedEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { status: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferFailedEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { reason: string; failureCode?: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferReturnedEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { returnCode?: string; reason?: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferCancelledEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { reason: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class TransferReversedEvent extends TransferEvent {
  constructor(
    transferId: string,
    sourceAccountId: string,
    public readonly payload: { reason: string; reversalTransactionId?: string },
  ) {
    super(transferId, sourceAccountId);
  }
}

export class BeneficiaryCreatedEvent {
  public readonly timestamp = new Date();

  constructor(
    public readonly beneficiaryId: string,
    public readonly userId: string,
  ) {}
}

export class BeneficiaryVerifiedEvent {
  public readonly timestamp = new Date();

  constructor(
    public readonly beneficiaryId: string,
    public readonly userId: string,
  ) {}
}
