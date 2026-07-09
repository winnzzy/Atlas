import { ForbiddenException } from '@nestjs/common';
import { AccountPolicy, type AuthenticatedUser } from '../account.policy';

describe('AccountPolicy', () => {
  let policy: AccountPolicy;

  const regularUser: AuthenticatedUser = { id: 'user-1', email: 'user@test.com' };
  const otherUser: AuthenticatedUser = { id: 'user-2', email: 'other@test.com' };
  const adminUser: AuthenticatedUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };
  const superAdmin: AuthenticatedUser = { id: 'sa-1', email: 'sa@test.com', role: 'SUPER_ADMIN' };

  beforeEach(() => {
    policy = new AccountPolicy();
  });

  describe('canCreateAccount', () => {
    it('should allow any authenticated user to create an account', () => {
      expect(() => policy.canCreateAccount(regularUser)).not.toThrow();
    });

    it('should allow admin to create an account', () => {
      expect(() => policy.canCreateAccount(adminUser)).not.toThrow();
    });
  });

  describe('canViewAccount', () => {
    it('should allow owner to view their own account', () => {
      expect(() => policy.canViewAccount(regularUser, regularUser.id)).not.toThrow();
    });

    it('should allow admin to view any account', () => {
      expect(() => policy.canViewAccount(adminUser, regularUser.id)).not.toThrow();
    });

    it('should allow super admin to view any account', () => {
      expect(() => policy.canViewAccount(superAdmin, regularUser.id)).not.toThrow();
    });

    it('should deny non-owner non-admin from viewing', () => {
      expect(() => policy.canViewAccount(otherUser, regularUser.id)).toThrow(ForbiddenException);
    });
  });

  describe('canModifyAccount', () => {
    it('should allow owner to modify their ACTIVE account', () => {
      expect(() => policy.canModifyAccount(regularUser, regularUser.id, 'ACTIVE')).not.toThrow();
    });

    it('should allow admin to modify any ACTIVE account', () => {
      expect(() => policy.canModifyAccount(adminUser, regularUser.id, 'ACTIVE')).not.toThrow();
    });

    it('should deny non-owner from modifying', () => {
      expect(() => policy.canModifyAccount(otherUser, regularUser.id, 'ACTIVE')).toThrow(
        ForbiddenException,
      );
    });

    it('should deny modification of CLOSED accounts', () => {
      expect(() => policy.canModifyAccount(regularUser, regularUser.id, 'CLOSED')).toThrow(
        ForbiddenException,
      );
    });

    it('should deny modification of ARCHIVED accounts', () => {
      expect(() => policy.canModifyAccount(regularUser, regularUser.id, 'ARCHIVED')).toThrow(
        ForbiddenException,
      );
    });

    it('should allow modification of FROZEN accounts by owner', () => {
      expect(() => policy.canModifyAccount(regularUser, regularUser.id, 'FROZEN')).not.toThrow();
    });

    it('should allow modification of LOCKED accounts by owner', () => {
      expect(() => policy.canModifyAccount(regularUser, regularUser.id, 'LOCKED')).not.toThrow();
    });
  });

  describe('canCloseAccount', () => {
    it('should allow owner to close their own account', () => {
      expect(() => policy.canCloseAccount(regularUser, regularUser.id)).not.toThrow();
    });

    it('should allow admin to close any account', () => {
      expect(() => policy.canCloseAccount(adminUser, regularUser.id)).not.toThrow();
    });

    it('should deny non-owner from closing', () => {
      expect(() => policy.canCloseAccount(otherUser, regularUser.id)).toThrow(ForbiddenException);
    });
  });

  describe('requireAdmin', () => {
    it('should allow ADMIN role', () => {
      expect(() => policy.requireAdmin(adminUser)).not.toThrow();
    });

    it('should allow SUPER_ADMIN role', () => {
      expect(() => policy.requireAdmin(superAdmin)).not.toThrow();
    });

    it('should deny regular user', () => {
      expect(() => policy.requireAdmin(regularUser)).toThrow(ForbiddenException);
    });

    it('should deny user with no role', () => {
      expect(() => policy.requireAdmin({ id: 'u', email: 'u@t.com' })).toThrow(ForbiddenException);
    });
  });

  describe('canViewStatements', () => {
    it('should allow owner to view statements', () => {
      expect(() => policy.canViewStatements(regularUser, regularUser.id)).not.toThrow();
    });

    it('should allow admin to view statements', () => {
      expect(() => policy.canViewStatements(adminUser, regularUser.id)).not.toThrow();
    });

    it('should deny non-owner non-admin', () => {
      expect(() => policy.canViewStatements(otherUser, regularUser.id)).toThrow(ForbiddenException);
    });
  });

  describe('canViewBalance', () => {
    it('should allow owner to view balance', () => {
      expect(() => policy.canViewBalance(regularUser, regularUser.id)).not.toThrow();
    });

    it('should allow admin to view balance', () => {
      expect(() => policy.canViewBalance(adminUser, regularUser.id)).not.toThrow();
    });

    it('should deny non-owner non-admin', () => {
      expect(() => policy.canViewBalance(otherUser, regularUser.id)).toThrow(ForbiddenException);
    });
  });

  describe('canViewHolds', () => {
    it('should allow owner to view holds', () => {
      expect(() => policy.canViewHolds(regularUser, regularUser.id)).not.toThrow();
    });

    it('should allow admin to view holds', () => {
      expect(() => policy.canViewHolds(adminUser, regularUser.id)).not.toThrow();
    });

    it('should deny non-owner non-admin', () => {
      expect(() => policy.canViewHolds(otherUser, regularUser.id)).toThrow(ForbiddenException);
    });
  });
});
