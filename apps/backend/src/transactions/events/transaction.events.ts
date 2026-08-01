export enum TransactionEventType {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_AUTHORIZED = 'transaction.authorized',
  TRANSACTION_POSTED = 'transaction.posted',
  TRANSACTION_SETTLED = 'transaction.settled',
  TRANSACTION_COMPLETED = 'transaction.completed',
  TRANSACTION_FAILED = 'transaction.failed',
  TRANSACTION_CANCELLED = 'transaction.cancelled',
  TRANSACTION_REVERSED = 'transaction.reversed',
}

export abstract class TransactionEvent {
  public readonly timestamp: Date;
  constructor(
    public readonly transactionId: string,
    public readonly accountId: string,
  ) {
    this.timestamp = new Date();
  }
}

export class TransactionCreatedEvent extends TransactionEvent {
  constructor(
    transactionId: string,
    accountId: string,
    public readonly payload: {
      type: string;
      amount: string;
      currency: string;
      description?: string;
      reference?: string;
      createdBy?: string;
    },
  ) {
    super(transactionId, accountId);
  }
}

export class TransactionAuthorizedEvent extends TransactionEvent {
  constructor(
    transactionId: string,
    accountId: string,
    public readonly payload: {
      type: string;
      amount: string;
      authorizedBy: string;
    },
  ) {
    super(transactionId, accountId);
  }
}

export class TransactionPostedEvent extends TransactionEvent {
  constructor(
    transactionId: string,
    accountId: string,
    public readonly payload: {
      type: string;
      amount: string;
      journalId: string;
      postedBy: string;
    },
  ) {
    super(transactionId, accountId);
  }
}

export class TransactionSettledEvent extends TransactionEvent {
  constructor(
    transactionId: string,
    accountId: string,
    public readonly payload: {
      amount: string;
      settledBy: string;
    },
  ) {
    super(transactionId, accountId);
  }
}

export class TransactionCompletedEvent extends TransactionEvent {
  constructor(
    transactionId: string,
    accountId: string,
    public readonly payload: {
      type: string;
      amount: string;
      status: string;
    },
  ) {
    super(transactionId, accountId);
  }
}

export class TransactionFailedEvent extends TransactionEvent {
  constructor(
    transactionId: string,
    accountId: string,
    public readonly payload: {
      type: string;
      reason: string;
      failureCode?: string;
    },
  ) {
    super(transactionId, accountId);
  }
}

export class TransactionCancelledEvent extends TransactionEvent {
  constructor(
    transactionId: string,
    accountId: string,
    public readonly payload: {
      reason: string;
      cancelledBy: string;
    },
  ) {
    super(transactionId, accountId);
  }
}

export class TransactionReversedEvent extends TransactionEvent {
  constructor(
    transactionId: string,
    accountId: string,
    public readonly payload: {
      reason: string;
      reversedBy: string;
      reversalId: string;
    },
  ) {
    super(transactionId, accountId);
  }
}