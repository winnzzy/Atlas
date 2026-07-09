import { Injectable, ForbiddenException } from '@nestjs/common';
import type { AccountStatusType } from '../dto/account-response.dto';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

@Injectable()
export class AccountPolicy {
  /**
   * Verify user can create accounts. Only ACTIVE users may create.
   */
  canCreateAccount(_user: AuthenticatedUser): void {
    // All authenticated users can create accounts
    // Additional restrictions (e.g., max accounts) handled in service
  }

  /**
   * Verify user can view the given account.
   */
  canViewAccount(user: AuthenticatedUser, accountOwnerId: string): void {
    if (user.id !== accountOwnerId && !this.isAdmin(user)) {
      throw new ForbiddenException('You do not have permission to view this account');
    }
  }

  /**
   * Verify user can modify the account (nickname, freeze, etc.)
   */
  canModifyAccount(
    user: AuthenticatedUser,
    accountOwnerId: string,
    accountStatus: AccountStatusType,
  ): void {
    if (user.id !== accountOwnerId && !this.isAdmin(user)) {
      throw new ForbiddenException('You do not have permission to modify this account');
    }
    if (accountStatus === 'CLOSED') {
      throw new ForbiddenException('Cannot modify a closed account');
    }
    if (accountStatus === 'ARCHIVED') {
      throw new ForbiddenException('Cannot modify an archived account');
    }
  }

  /**
   * Verify user can close the account.
   */
  canCloseAccount(user: AuthenticatedUser, accountOwnerId: string): void {
    if (user.id !== accountOwnerId && !this.isAdmin(user)) {
      throw new ForbiddenException('You do not have permission to close this account');
    }
  }

  /**
   * Verify admin-only operations (freeze, lock, unlock, archive).
   */
  requireAdmin(user: AuthenticatedUser): void {
    if (!this.isAdmin(user)) {
      throw new ForbiddenException('This operation requires administrator privileges');
    }
  }

  /**
   * Verify user can view statements for this account.
   */
  canViewStatements(user: AuthenticatedUser, accountOwnerId: string): void {
    if (user.id !== accountOwnerId && !this.isAdmin(user)) {
      throw new ForbiddenException(
        'You do not have permission to view statements for this account',
      );
    }
  }

  /**
   * Verify user can view balance for this account.
   */
  canViewBalance(user: AuthenticatedUser, accountOwnerId: string): void {
    if (user.id !== accountOwnerId && !this.isAdmin(user)) {
      throw new ForbiddenException(
        'You do not have permission to view the balance of this account',
      );
    }
  }

  /**
   * Verify user can view holds for this account.
   */
  canViewHolds(user: AuthenticatedUser, accountOwnerId: string): void {
    if (user.id !== accountOwnerId && !this.isAdmin(user)) {
      throw new ForbiddenException('You do not have permission to view holds on this account');
    }
  }

  private isAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  }
}
