import { InvalidAccountTransitionException } from '../exceptions/account-domain.exception';

/**
 * Extended account status for domain logic.
 * Maps to Prisma AccountStatus enum plus additional states handled at domain level.
 */
export const AccountDomainStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  RESTRICTED: 'RESTRICTED',
  FROZEN: 'FROZEN',
  LOCKED: 'LOCKED',
  DORMANT: 'DORMANT',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type AccountDomainStatus = (typeof AccountDomainStatus)[keyof typeof AccountDomainStatus];

/**
 * Valid state transitions for account lifecycle.
 *
 * PENDING   → ACTIVE, CLOSED
 * ACTIVE    → FROZEN, LOCKED, DORMANT, CLOSED
 * RESTRICTED → ACTIVE, FROZEN, LOCKED, CLOSED
 * FROZEN    → ACTIVE, CLOSED
 * LOCKED    → ACTIVE, CLOSED
 * DORMANT   → ACTIVE, CLOSED
 * CLOSED    → ARCHIVED
 * ARCHIVED  → (terminal)
 */
const VALID_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  [AccountDomainStatus.PENDING]: new Set([AccountDomainStatus.ACTIVE, AccountDomainStatus.CLOSED]),
  [AccountDomainStatus.ACTIVE]: new Set([
    AccountDomainStatus.FROZEN,
    AccountDomainStatus.LOCKED,
    AccountDomainStatus.DORMANT,
    AccountDomainStatus.CLOSED,
  ]),
  [AccountDomainStatus.RESTRICTED]: new Set([
    AccountDomainStatus.ACTIVE,
    AccountDomainStatus.FROZEN,
    AccountDomainStatus.LOCKED,
    AccountDomainStatus.CLOSED,
  ]),
  [AccountDomainStatus.FROZEN]: new Set([AccountDomainStatus.ACTIVE, AccountDomainStatus.CLOSED]),
  [AccountDomainStatus.LOCKED]: new Set([AccountDomainStatus.ACTIVE, AccountDomainStatus.CLOSED]),
  [AccountDomainStatus.DORMANT]: new Set([AccountDomainStatus.ACTIVE, AccountDomainStatus.CLOSED]),
  [AccountDomainStatus.CLOSED]: new Set([AccountDomainStatus.ARCHIVED]),
  [AccountDomainStatus.ARCHIVED]: new Set(),
};

export class AccountStateMachine {
  static validateTransition(currentStatus: string, targetStatus: string): void {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.has(targetStatus)) {
      throw new InvalidAccountTransitionException(currentStatus, targetStatus);
    }
  }

  static canTransition(currentStatus: string, targetStatus: string): boolean {
    const allowed = VALID_TRANSITIONS[currentStatus];
    return allowed ? allowed.has(targetStatus) : false;
  }

  static getValidTransitions(currentStatus: string): string[] {
    const allowed = VALID_TRANSITIONS[currentStatus];
    return allowed ? Array.from(allowed) : [];
  }

  static isActive(status: string): boolean {
    return status === AccountDomainStatus.ACTIVE;
  }

  static isClosed(status: string): boolean {
    return status === AccountDomainStatus.CLOSED;
  }

  static isFrozen(status: string): boolean {
    return status === AccountDomainStatus.FROZEN;
  }

  static isLocked(status: string): boolean {
    return status === AccountDomainStatus.LOCKED;
  }

  static isTerminal(status: string): boolean {
    return status === AccountDomainStatus.CLOSED || status === AccountDomainStatus.ARCHIVED;
  }

  static canDebit(status: string): boolean {
    return status === AccountDomainStatus.ACTIVE;
  }

  static canCredit(status: string): boolean {
    return (
      status === AccountDomainStatus.ACTIVE ||
      status === AccountDomainStatus.FROZEN ||
      status === AccountDomainStatus.LOCKED
    );
  }
}
