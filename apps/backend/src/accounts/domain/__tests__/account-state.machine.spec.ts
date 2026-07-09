import { AccountStateMachine, AccountDomainStatus } from '../account-state.machine';
import { InvalidAccountTransitionException } from '../../exceptions/account-domain.exception';

describe('AccountStateMachine', () => {
  describe('canTransition', () => {
    it('should allow PENDING -> ACTIVE', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.PENDING, AccountDomainStatus.ACTIVE),
      ).toBe(true);
    });

    it('should allow PENDING -> CLOSED', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.PENDING, AccountDomainStatus.CLOSED),
      ).toBe(true);
    });

    it('should allow ACTIVE -> FROZEN', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.ACTIVE, AccountDomainStatus.FROZEN),
      ).toBe(true);
    });

    it('should allow ACTIVE -> LOCKED', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.ACTIVE, AccountDomainStatus.LOCKED),
      ).toBe(true);
    });

    it('should allow ACTIVE -> DORMANT', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.ACTIVE, AccountDomainStatus.DORMANT),
      ).toBe(true);
    });

    it('should allow ACTIVE -> CLOSED', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.ACTIVE, AccountDomainStatus.CLOSED),
      ).toBe(true);
    });

    it('should allow FROZEN -> ACTIVE', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.FROZEN, AccountDomainStatus.ACTIVE),
      ).toBe(true);
    });

    it('should allow FROZEN -> CLOSED', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.FROZEN, AccountDomainStatus.CLOSED),
      ).toBe(true);
    });

    it('should allow LOCKED -> ACTIVE', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.LOCKED, AccountDomainStatus.ACTIVE),
      ).toBe(true);
    });

    it('should allow LOCKED -> CLOSED', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.LOCKED, AccountDomainStatus.CLOSED),
      ).toBe(true);
    });

    it('should allow DORMANT -> ACTIVE', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.DORMANT, AccountDomainStatus.ACTIVE),
      ).toBe(true);
    });

    it('should allow CLOSED -> ARCHIVED', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.CLOSED, AccountDomainStatus.ARCHIVED),
      ).toBe(true);
    });

    it('should allow RESTRICTED -> ACTIVE', () => {
      expect(
        AccountStateMachine.canTransition(
          AccountDomainStatus.RESTRICTED,
          AccountDomainStatus.ACTIVE,
        ),
      ).toBe(true);
    });

    it('should allow RESTRICTED -> FROZEN', () => {
      expect(
        AccountStateMachine.canTransition(
          AccountDomainStatus.RESTRICTED,
          AccountDomainStatus.FROZEN,
        ),
      ).toBe(true);
    });

    it('should allow RESTRICTED -> LOCKED', () => {
      expect(
        AccountStateMachine.canTransition(
          AccountDomainStatus.RESTRICTED,
          AccountDomainStatus.LOCKED,
        ),
      ).toBe(true);
    });

    it('should allow RESTRICTED -> CLOSED', () => {
      expect(
        AccountStateMachine.canTransition(
          AccountDomainStatus.RESTRICTED,
          AccountDomainStatus.CLOSED,
        ),
      ).toBe(true);
    });

    it('should disallow CLOSED -> ACTIVE', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.CLOSED, AccountDomainStatus.ACTIVE),
      ).toBe(false);
    });

    it('should disallow ARCHIVED -> any', () => {
      const allStatuses = Object.values(AccountDomainStatus);
      for (const status of allStatuses) {
        expect(AccountStateMachine.canTransition(AccountDomainStatus.ARCHIVED, status)).toBe(false);
      }
    });

    it('should disallow FROZEN -> LOCKED', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.FROZEN, AccountDomainStatus.LOCKED),
      ).toBe(false);
    });

    it('should disallow ACTIVE -> PENDING', () => {
      expect(
        AccountStateMachine.canTransition(AccountDomainStatus.ACTIVE, AccountDomainStatus.PENDING),
      ).toBe(false);
    });

    it('should disallow PENDING -> ARCHIVED', () => {
      expect(
        AccountStateMachine.canTransition(
          AccountDomainStatus.PENDING,
          AccountDomainStatus.ARCHIVED,
        ),
      ).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('should not throw on valid transition', () => {
      expect(() => {
        AccountStateMachine.validateTransition(
          AccountDomainStatus.PENDING,
          AccountDomainStatus.ACTIVE,
        );
      }).not.toThrow();
    });

    it('should throw InvalidAccountTransitionException on invalid transition', () => {
      expect(() => {
        AccountStateMachine.validateTransition(
          AccountDomainStatus.CLOSED,
          AccountDomainStatus.ACTIVE,
        );
      }).toThrow(InvalidAccountTransitionException);
    });

    it('should throw with descriptive message on invalid transition', () => {
      expect(() => {
        AccountStateMachine.validateTransition(
          AccountDomainStatus.ARCHIVED,
          AccountDomainStatus.ACTIVE,
        );
      }).toThrow(/Cannot transition account from 'ARCHIVED' to 'ACTIVE'/);
    });
  });

  describe('getValidTransitions', () => {
    it('should return correct transitions for PENDING', () => {
      const transitions = AccountStateMachine.getValidTransitions(AccountDomainStatus.PENDING);
      expect(transitions).toContain(AccountDomainStatus.ACTIVE);
      expect(transitions).toContain(AccountDomainStatus.CLOSED);
      expect(transitions).toHaveLength(2);
    });

    it('should return correct transitions for ACTIVE', () => {
      const transitions = AccountStateMachine.getValidTransitions(AccountDomainStatus.ACTIVE);
      expect(transitions).toContain(AccountDomainStatus.FROZEN);
      expect(transitions).toContain(AccountDomainStatus.LOCKED);
      expect(transitions).toContain(AccountDomainStatus.DORMANT);
      expect(transitions).toContain(AccountDomainStatus.CLOSED);
      expect(transitions).toHaveLength(4);
    });

    it('should return correct transitions for CLOSED', () => {
      const transitions = AccountStateMachine.getValidTransitions(AccountDomainStatus.CLOSED);
      expect(transitions).toContain(AccountDomainStatus.ARCHIVED);
      expect(transitions).toHaveLength(1);
    });

    it('should return empty for ARCHIVED', () => {
      const transitions = AccountStateMachine.getValidTransitions(AccountDomainStatus.ARCHIVED);
      expect(transitions).toHaveLength(0);
    });
  });

  describe('isTerminal', () => {
    it('should return true for ARCHIVED', () => {
      expect(AccountStateMachine.isTerminal(AccountDomainStatus.ARCHIVED)).toBe(true);
    });

    it('should return true for CLOSED', () => {
      expect(AccountStateMachine.isTerminal(AccountDomainStatus.CLOSED)).toBe(true);
    });

    it('should return false for ACTIVE', () => {
      expect(AccountStateMachine.isTerminal(AccountDomainStatus.ACTIVE)).toBe(false);
    });

    it('should return false for PENDING', () => {
      expect(AccountStateMachine.isTerminal(AccountDomainStatus.PENDING)).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true for ACTIVE', () => {
      expect(AccountStateMachine.isActive(AccountDomainStatus.ACTIVE)).toBe(true);
    });

    it('should return false for FROZEN', () => {
      expect(AccountStateMachine.isActive(AccountDomainStatus.FROZEN)).toBe(false);
    });

    it('should return false for CLOSED', () => {
      expect(AccountStateMachine.isActive(AccountDomainStatus.CLOSED)).toBe(false);
    });

    it('should return false for DORMANT', () => {
      expect(AccountStateMachine.isActive(AccountDomainStatus.DORMANT)).toBe(false);
    });
  });

  describe('canDebit', () => {
    it('should return true for ACTIVE', () => {
      expect(AccountStateMachine.canDebit(AccountDomainStatus.ACTIVE)).toBe(true);
    });

    it('should return false for FROZEN', () => {
      expect(AccountStateMachine.canDebit(AccountDomainStatus.FROZEN)).toBe(false);
    });

    it('should return false for LOCKED', () => {
      expect(AccountStateMachine.canDebit(AccountDomainStatus.LOCKED)).toBe(false);
    });

    it('should return false for DORMANT', () => {
      expect(AccountStateMachine.canDebit(AccountDomainStatus.DORMANT)).toBe(false);
    });
  });

  describe('canCredit', () => {
    it('should return true for ACTIVE', () => {
      expect(AccountStateMachine.canCredit(AccountDomainStatus.ACTIVE)).toBe(true);
    });

    it('should return true for FROZEN', () => {
      expect(AccountStateMachine.canCredit(AccountDomainStatus.FROZEN)).toBe(true);
    });

    it('should return true for LOCKED', () => {
      expect(AccountStateMachine.canCredit(AccountDomainStatus.LOCKED)).toBe(true);
    });

    it('should return false for CLOSED', () => {
      expect(AccountStateMachine.canCredit(AccountDomainStatus.CLOSED)).toBe(false);
    });
  });

  describe('status checks', () => {
    it('isClosed should return true for CLOSED only', () => {
      expect(AccountStateMachine.isClosed(AccountDomainStatus.CLOSED)).toBe(true);
      expect(AccountStateMachine.isClosed(AccountDomainStatus.ACTIVE)).toBe(false);
    });

    it('isFrozen should return true for FROZEN only', () => {
      expect(AccountStateMachine.isFrozen(AccountDomainStatus.FROZEN)).toBe(true);
      expect(AccountStateMachine.isFrozen(AccountDomainStatus.ACTIVE)).toBe(false);
    });

    it('isLocked should return true for LOCKED only', () => {
      expect(AccountStateMachine.isLocked(AccountDomainStatus.LOCKED)).toBe(true);
      expect(AccountStateMachine.isLocked(AccountDomainStatus.ACTIVE)).toBe(false);
    });
  });
});
