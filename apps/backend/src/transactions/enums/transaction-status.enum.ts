/**
 * Transaction lifecycle statuses.
 * Represents the full state machine from creation to terminal states.
 */
export enum TransactionStatus {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  AUTHORIZED = 'AUTHORIZED',
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  SETTLED = 'SETTLED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
  EXPIRED = 'EXPIRED',
}

/**
 * Valid state transitions for the transaction lifecycle.
 * Maps current status -> set of valid next statuses.
 */
export const VALID_STATUS_TRANSITIONS: Record<TransactionStatus, Set<TransactionStatus>> = {
  [TransactionStatus.CREATED]: new Set([
    TransactionStatus.VALIDATED,
    TransactionStatus.FAILED,
    TransactionStatus.CANCELLED,
  ]),
  [TransactionStatus.VALIDATED]: new Set([
    TransactionStatus.AUTHORIZED,
    TransactionStatus.FAILED,
    TransactionStatus.CANCELLED,
  ]),
  [TransactionStatus.AUTHORIZED]: new Set([
    TransactionStatus.PENDING,
    TransactionStatus.FAILED,
    TransactionStatus.CANCELLED,
  ]),
  [TransactionStatus.PENDING]: new Set([
    TransactionStatus.POSTED,
    TransactionStatus.FAILED,
    TransactionStatus.CANCELLED,
    TransactionStatus.EXPIRED,
  ]),
  [TransactionStatus.POSTED]: new Set([
    TransactionStatus.SETTLED,
    TransactionStatus.FAILED,
    TransactionStatus.REVERSED,
  ]),
  [TransactionStatus.SETTLED]: new Set([
    TransactionStatus.COMPLETED,
    TransactionStatus.REVERSED,
  ]),
  [TransactionStatus.COMPLETED]: new Set([
    TransactionStatus.REVERSED,
  ]),
  [TransactionStatus.FAILED]: new Set<TransactionStatus>([]),
  [TransactionStatus.CANCELLED]: new Set<TransactionStatus>([]),
  [TransactionStatus.REVERSED]: new Set<TransactionStatus>([]),
  [TransactionStatus.EXPIRED]: new Set<TransactionStatus>([]),
};

/**
 * Terminal statuses - no further transitions possible.
 */
export const TERMINAL_STATUSES = new Set<TransactionStatus>([
  TransactionStatus.COMPLETED,
  TransactionStatus.FAILED,
  TransactionStatus.CANCELLED,
  TransactionStatus.REVERSED,
  TransactionStatus.EXPIRED,
]);

/**
 * Active (non-terminal) statuses.
 */
export const ACTIVE_STATUSES = new Set<TransactionStatus>([
  TransactionStatus.CREATED,
  TransactionStatus.VALIDATED,
  TransactionStatus.AUTHORIZED,
  TransactionStatus.PENDING,
  TransactionStatus.POSTED,
  TransactionStatus.SETTLED,
]);

/**
 * Validates a state transition.
 * Throws if the transition is not allowed.
 */
export function validateStatusTransition(
  current: TransactionStatus,
  next: TransactionStatus,
): void {
  const allowed = VALID_STATUS_TRANSITIONS[current];
  if (!allowed || !allowed.has(next)) {
    throw new Error(
      `Invalid transaction status transition: ${current} -> ${next}`,
    );
  }
}