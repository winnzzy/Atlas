import type { AccountId, UserId } from '../common/identifiers';
import type { Currency, AccountStatus } from '../common/enums';

/**
 * Core account entity type.
 */
export type Account = {
  readonly id: AccountId;
  readonly userId: UserId;
  readonly name: string;
  readonly currency: Currency;
  readonly balance: string;
  readonly status: AccountStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * Account creation input.
 */
export type CreateAccountInput = {
  readonly name: string;
  readonly currency: Currency;
};

/**
 * Account balance update.
 */
export type AccountBalance = {
  readonly accountId: AccountId;
  readonly balance: string;
  readonly currency: Currency;
  readonly updatedAt: string;
};
