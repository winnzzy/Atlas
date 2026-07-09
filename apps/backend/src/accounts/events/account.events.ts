export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
}

// Domain event factory is used internally by each event class constructor.
export class AccountCreatedEvent implements DomainEvent {
  readonly eventType = 'account.created';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      userId: string;
      accountType: string;
      currency: string;
      name: string;
    },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class AccountActivatedEvent implements DomainEvent {
  readonly eventType = 'account.activated';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { previousStatus: string; activatedBy: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class AccountFrozenEvent implements DomainEvent {
  readonly eventType = 'account.frozen';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { reason: string; note?: string; frozenBy: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class AccountUnfrozenEvent implements DomainEvent {
  readonly eventType = 'account.unfrozen';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { unfrozenBy: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class AccountClosedEvent implements DomainEvent {
  readonly eventType = 'account.closed';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { reason: string; closedBy: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class AccountLockedEvent implements DomainEvent {
  readonly eventType = 'account.locked';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { reason: string; lockedBy: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class AccountUnlockedEvent implements DomainEvent {
  readonly eventType = 'account.unlocked';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { unlockedBy: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class AccountNicknameChangedEvent implements DomainEvent {
  readonly eventType = 'account.nickname_changed';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { oldNickname: string | null; newNickname: string; changedBy: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class AccountArchivedEvent implements DomainEvent {
  readonly eventType = 'account.archived';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { archivedBy: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class BalanceViewedEvent implements DomainEvent {
  readonly eventType = 'account.balance_viewed';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { viewedBy: string; balanceType: 'current' | 'available' },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

export class StatementRequestedEvent implements DomainEvent {
  readonly eventType = 'account.statement_requested';
  readonly eventId: string;
  readonly occurredAt: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: { requestedBy: string; startDate: string; endDate: string },
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date().toISOString();
  }
}

/**
 * Simple in-memory event bus for domain events.
 * Events are stored in memory and can be consumed by subscribers.
 */
export class AccountEventBus {
  private handlers: Map<string, Array<(event: DomainEvent) => void>> = new Map();
  private eventLog: DomainEvent[] = [];

  publish(event: DomainEvent): void {
    this.eventLog.push(event);
    const handlers = this.handlers.get(event.eventType) ?? [];
    for (const handler of handlers) {
      handler(event);
    }
    // Also notify wildcard subscribers
    const wildcardHandlers = this.handlers.get('*') ?? [];
    for (const handler of wildcardHandlers) {
      handler(event);
    }
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  getEventLog(): ReadonlyArray<DomainEvent> {
    return [...this.eventLog];
  }

  clearLog(): void {
    this.eventLog = [];
  }
}
