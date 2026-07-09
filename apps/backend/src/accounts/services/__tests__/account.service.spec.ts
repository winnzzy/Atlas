import { Test, type TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { AccountService } from '../account.service';
import { AccountRepository } from '../../repositories/account.repository';
import { AccountPolicy } from '../../policies/account.policy';
import type { AuthenticatedUser } from '../../policies/account.policy';

// ─── Helpers ────────────────────────────────────────────────────────

const USER: AuthenticatedUser = { id: 'user-1', email: 'user@test.com' };
const ADMIN: AuthenticatedUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };

function makeAccount(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 'acct-1',
    accountNumber: '1234567890',
    routingNumber: '021000021',
    type: 'CHECKING',
    status: 'ACTIVE',
    name: 'Checking Account',
    nickname: null as string | null,
    currency: 'USD',
    currentBalance: new Decimal(0),
    availableBalance: new Decimal(0),
    pendingBalance: new Decimal(0),
    holdAmount: new Decimal(0),
    overdraftLimit: new Decimal(0),
    dailyLimit: new Decimal(5000),
    monthlyLimit: new Decimal(25000),
    interestRate: null as Decimal | null,
    freezeReason: null as string | null,
    freezeNote: null as string | null,
    closedAt: null as Date | null,
    closureReason: null as string | null,
    isDemo: false,
    metadata: null as unknown,
    createdAt: now,
    updatedAt: now,
    deletedAt: null as Date | null,
    createdBy: 'user-1' as string | null,
    updatedBy: null as string | null,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('AccountService', () => {
  let service: AccountService;
  let repository: jest.Mocked<AccountRepository>;

  beforeEach(async () => {
    const mockRepo: jest.Mocked<AccountRepository> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUser: jest.fn(),
      findByUserId: jest.fn(),
      findByAccountNumber: jest.fn(),
      updateStatus: jest.fn(),
      updateNickname: jest.fn(),
      softDelete: jest.fn(),
      updateBalance: jest.fn(),
      isAccountHolder: jest.fn(),
      getAccountHolders: jest.fn(),
    } as unknown as jest.Mocked<AccountRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        AccountPolicy,
        { provide: AccountRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(AccountService);
    repository = module.get(AccountRepository);
  });

  // ─── createAccount ──────────────────────────────────────────────

  describe('createAccount', () => {
    it('should create an account and auto-activate it', async () => {
      repository.findByUserId.mockResolvedValue({ accounts: [], total: 0 });
      repository.create.mockResolvedValue(makeAccount({ status: 'PENDING' }));
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));

      const result = await service.createAccount(USER, {
        accountType: 'CHECKING' as never,
        name: 'My Checking',
      });

      expect(result.status).toBe('ACTIVE');
      expect(result.accountType).toBe('CHECKING');
      expect(repository.create).toHaveBeenCalled();
      expect(repository.updateStatus).toHaveBeenCalledWith('acct-1', 'ACTIVE');
    });

    it('should throw ConflictException when max accounts reached', async () => {
      repository.findByUserId.mockResolvedValue({
        accounts: Array(10).fill(makeAccount()),
        total: 10,
      });

      await expect(
        service.createAccount(USER, { accountType: 'CHECKING' as never, name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate nickname', async () => {
      repository.findByUserId.mockResolvedValue({
        accounts: [makeAccount({ nickname: 'My Account' })],
        total: 1,
      });

      await expect(
        service.createAccount(USER, {
          accountType: 'CHECKING' as never,
          name: 'Test',
          nickname: 'My Account',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── getAccount ─────────────────────────────────────────────────

  describe('getAccount', () => {
    it('should return the account when found and owned', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await service.getAccount(USER, 'acct-1');
      expect(result.id).toBe('acct-1');
    });

    it('should throw NotFoundException when account not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getAccount(USER, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not owner', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.isAccountHolder.mockResolvedValue(false);
      await expect(service.getAccount(USER, 'acct-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── listAccounts ───────────────────────────────────────────────

  describe('listAccounts', () => {
    it('should return paginated accounts', async () => {
      repository.findByUserId.mockResolvedValue({ accounts: [makeAccount()], total: 1 });

      const result = await service.listAccounts(USER);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  // ─── updateNickname ─────────────────────────────────────────────

  describe('updateNickname', () => {
    it('should update the nickname', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.isAccountHolder.mockResolvedValue(true);
      repository.findByUserId.mockResolvedValue({ accounts: [makeAccount()], total: 1 });
      repository.updateNickname.mockResolvedValue(makeAccount({ nickname: 'New Name' }));

      const result = await service.updateNickname(USER, 'acct-1', { nickname: 'New Name' });
      expect(result.nickname).toBe('New Name');
    });

    it('should throw ConflictException on duplicate nickname', async () => {
      const existing = makeAccount({ id: 'acct-2', nickname: 'Taken' });
      repository.findById.mockResolvedValue(makeAccount());
      repository.isAccountHolder.mockResolvedValue(true);
      repository.findByUserId.mockResolvedValue({ accounts: [makeAccount(), existing], total: 2 });

      await expect(service.updateNickname(USER, 'acct-1', { nickname: 'Taken' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── freezeAccount ──────────────────────────────────────────────

  describe('freezeAccount', () => {
    it('should freeze an active account (admin)', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.updateStatus.mockResolvedValue(
        makeAccount({ status: 'FROZEN', freezeReason: 'FRAUD_ALERT' }),
      );

      const result = await service.freezeAccount(ADMIN, 'acct-1', 'FRAUD_ALERT');
      expect(result.status).toBe('FROZEN');
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(service.freezeAccount(USER, 'acct-1', 'FRAUD_ALERT')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw on invalid transition (CLOSED -> FROZEN)', async () => {
      repository.findById.mockResolvedValue(makeAccount({ status: 'CLOSED' }));
      await expect(service.freezeAccount(ADMIN, 'acct-1', 'FRAUD_ALERT')).rejects.toThrow();
    });
  });

  // ─── unfreezeAccount ────────────────────────────────────────────

  describe('unfreezeAccount', () => {
    it('should unfreeze a frozen account (admin)', async () => {
      repository.findById.mockResolvedValue(makeAccount({ status: 'FROZEN' }));
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));

      const result = await service.unfreezeAccount(ADMIN, 'acct-1');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw BadRequestException if account is not frozen', async () => {
      repository.findById.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));
      await expect(service.unfreezeAccount(ADMIN, 'acct-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── closeAccount ───────────────────────────────────────────────

  describe('closeAccount', () => {
    it('should close an account with zero balance', async () => {
      repository.findById.mockResolvedValue(
        makeAccount({
          status: 'ACTIVE',
          currentBalance: new Decimal(0),
          availableBalance: new Decimal(0),
        }),
      );
      repository.isAccountHolder.mockResolvedValue(true);
      repository.updateStatus.mockResolvedValue(
        makeAccount({ status: 'CLOSED', closedAt: new Date(), closureReason: 'USER_REQUEST' }),
      );

      const result = await service.closeAccount(USER, 'acct-1', 'USER_REQUEST');
      expect(result.status).toBe('CLOSED');
    });

    it('should throw ConflictException with positive balance', async () => {
      repository.findById.mockResolvedValue(makeAccount({ currentBalance: new Decimal(100) }));
      repository.isAccountHolder.mockResolvedValue(true);
      await expect(service.closeAccount(USER, 'acct-1', 'USER_REQUEST')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException with negative balance', async () => {
      repository.findById.mockResolvedValue(makeAccount({ currentBalance: new Decimal(-50) }));
      repository.isAccountHolder.mockResolvedValue(true);
      await expect(service.closeAccount(USER, 'acct-1', 'USER_REQUEST')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── lockAccount ────────────────────────────────────────────────

  describe('lockAccount', () => {
    it('should lock an active account (admin)', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'LOCKED' }));

      const result = await service.lockAccount(ADMIN, 'acct-1', 'Security concern');
      expect(result.status).toBe('LOCKED');
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(service.lockAccount(USER, 'acct-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── unlockAccount ──────────────────────────────────────────────

  describe('unlockAccount', () => {
    it('should unlock a locked account (admin)', async () => {
      repository.findById.mockResolvedValue(makeAccount({ status: 'LOCKED' }));
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));

      const result = await service.unlockAccount(ADMIN, 'acct-1');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw BadRequestException if account is not locked', async () => {
      repository.findById.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));
      await expect(service.unlockAccount(ADMIN, 'acct-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── archiveAccount ─────────────────────────────────────────────

  describe('archiveAccount', () => {
    it('should archive a closed account (admin)', async () => {
      repository.findById.mockResolvedValueOnce(makeAccount({ status: 'CLOSED' }));
      repository.softDelete.mockResolvedValue(undefined);
      repository.findById.mockResolvedValueOnce(makeAccount({ status: 'ARCHIVED' }));

      const result = await service.archiveAccount(ADMIN, 'acct-1');
      expect(result.status).toBe('ARCHIVED');
    });

    it('should throw ForbiddenException for non-admin', async () => {
      await expect(service.archiveAccount(USER, 'acct-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── getBalance ─────────────────────────────────────────────────

  describe('getBalance', () => {
    it('should return balance breakdown', async () => {
      repository.findById.mockResolvedValue(
        makeAccount({
          currentBalance: new Decimal(1000),
          availableBalance: new Decimal(900),
          pendingBalance: new Decimal(100),
          holdAmount: new Decimal(50),
        }),
      );
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await service.getBalance(USER, 'acct-1');
      expect(result.current).toBe('1000');
      expect(result.available).toBe('900');
      expect(result.pending).toBe('100');
      expect(result.held).toBe('50');
      expect(result.ledger).toBe('1100');
    });

    it('should throw ForbiddenException for non-owner', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.isAccountHolder.mockResolvedValue(false);
      await expect(service.getBalance(USER, 'acct-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── getAvailableBalance ────────────────────────────────────────

  describe('getAvailableBalance', () => {
    it('should return available balance', async () => {
      repository.findById.mockResolvedValue(makeAccount({ availableBalance: new Decimal(500) }));
      repository.isAccountHolder.mockResolvedValue(true);
      const result = await service.getAvailableBalance(USER, 'acct-1');
      expect(result.available).toBe('500');
      expect(result.currency).toBe('USD');
    });
  });

  // ─── getCurrentBalance ──────────────────────────────────────────

  describe('getCurrentBalance', () => {
    it('should return current balance', async () => {
      repository.findById.mockResolvedValue(makeAccount({ currentBalance: new Decimal(750) }));
      repository.isAccountHolder.mockResolvedValue(true);
      const result = await service.getCurrentBalance(USER, 'acct-1');
      expect(result.current).toBe('750');
      expect(result.currency).toBe('USD');
    });
  });

  // ─── getStatements ──────────────────────────────────────────────

  describe('getStatements', () => {
    it('should return statement periods', async () => {
      const createdAt = new Date('2025-01-15');
      repository.findById.mockResolvedValue(makeAccount({ createdAt }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await service.getStatements(USER, 'acct-1');
      expect(result.accountId).toBe('acct-1');
      expect(result.statements.length).toBeGreaterThan(0);
      expect(result.statements[0]).toHaveProperty('periodStart');
      expect(result.statements[0]).toHaveProperty('periodEnd');
    });

    it('should paginate statements', async () => {
      const createdAt = new Date('2024-01-01');
      repository.findById.mockResolvedValue(makeAccount({ createdAt }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await service.getStatements(USER, 'acct-1', { page: 1, limit: 3 });
      expect(result.statements.length).toBeLessThanOrEqual(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(3);
    });
  });

  // ─── getHolds ───────────────────────────────────────────────────

  describe('getHolds', () => {
    it('should return holds with aggregate amount', async () => {
      repository.findById.mockResolvedValue(makeAccount({ holdAmount: new Decimal(250) }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await service.getHolds(USER, 'acct-1');
      expect(result.accountId).toBe('acct-1');
      expect(result.totalHeldAmount).toBe('250');
      expect(result.holds).toHaveLength(1);
      expect(result.holds[0]?.amount).toBe('250');
    });

    it('should return empty holds when holdAmount is zero', async () => {
      repository.findById.mockResolvedValue(makeAccount({ holdAmount: new Decimal(0) }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await service.getHolds(USER, 'acct-1');
      expect(result.holds).toHaveLength(0);
    });
  });

  // ─── Events ─────────────────────────────────────────────────────

  describe('domain events', () => {
    it('should emit account.created event on creation', async () => {
      repository.findByUserId.mockResolvedValue({ accounts: [], total: 0 });
      repository.create.mockResolvedValue(makeAccount({ status: 'PENDING' }));
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));

      const handler = jest.fn();
      service.getEventBus().subscribe('account.created', handler);

      await service.createAccount(USER, { accountType: 'CHECKING' as never, name: 'Test' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit account.balance_viewed event on balance access', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.isAccountHolder.mockResolvedValue(true);

      const handler = jest.fn();
      service.getEventBus().subscribe('account.balance_viewed', handler);

      await service.getBalance(USER, 'acct-1');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit account.frozen event on freeze', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'FROZEN' }));

      const handler = jest.fn();
      service.getEventBus().subscribe('account.frozen', handler);

      await service.freezeAccount(ADMIN, 'acct-1', 'FRAUD_ALERT');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
