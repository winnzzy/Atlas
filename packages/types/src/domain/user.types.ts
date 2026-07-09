import type { UserId } from '../common/identifiers';
import type { UserRole, AccountStatus } from '../common/enums';

/**
 * Core user entity type.
 */
export type User = {
  readonly id: UserId;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly status: AccountStatus;
  readonly emailVerified: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * User profile (subset of user data for display).
 */
export type UserProfile = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'createdAt'>;

/**
 * User creation input.
 */
export type CreateUserInput = {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly password: string;
};
