import { Test, type TestingModule } from '@nestjs/testing';
import { AccountController } from '../account.controller';
import { AccountService } from '../../services/account.service';
import { AccountPolicy } from '../../policies/account.policy';
import { AccountRepository } from '../../repositories/account.repository';
import type { AuthenticatedUser } from '../../policies/account.policy';
import { AccountResponseDto } from '../../dto/account-response.dto';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Helpers ────────────────────────────────────────────────────────

const USER: AuthenticatedUser = { id: 'user-1', email: 'user@test.com' };
const ADMIN_USER: AuthenticatedUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };

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

describe('AccountController', () => {
  let controller: AccountController;
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
      controllers: [AccountController],
      providers: [
        AccountService,
        AccountPolicy,
        { provide: AccountRepository, useValue: mockRepo },
      ],
    }).compile();

    controller = module.get(AccountController);
    repository = module.get(AccountRepository);
  });

  // ─── create ──────────────────────────────────────────────────────

  describe('create', () => {
    it('should create an account and return AccountResponseDto', async () => {
      repository.findByUserId.mockResolvedValue({ accounts: [], total: 0 });
      repository.create.mockResolvedValue(makeAccount({ status: 'PENDING' }));
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));

      const result = await controller.create(USER, {
        accountType: 'CHECKING' as never,
        name: 'My Checking',
      });

      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.status).toBe('ACTIVE');
      expect(result.accountType).toBe('CHECKING');
    });
  });

  // ─── list ────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated accounts', async () => {
      repository.findByUserId.mockResolvedValue({ accounts: [makeAccount()], total: 1 });

      const result = await controller.list(USER);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.data[0]).toBeInstanceOf(AccountResponseDto);
    });

    it('should parse page and limit from strings', async () => {
      repository.findByUserId.mockResolvedValue({ accounts: [], total: 0 });

      const result = await controller.list(USER, undefined, undefined, '2', '10');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  // ─── getById ─────────────────────────────────────────────────────

  describe('getById', () => {
    it('should return the account', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await controller.getById(USER, 'acct-1');
      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.id).toBe('acct-1');
    });
  });

  // ─── updateNickname ─────────────────────────────────────────────

  describe('updateNickname', () => {
    it('should update nickname and return account', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.isAccountHolder.mockResolvedValue(true);
      repository.findByUserId.mockResolvedValue({ accounts: [makeAccount()], total: 1 });
      repository.updateNickname.mockResolvedValue(makeAccount({ nickname: 'New Name' }));

      const result = await controller.updateNickname(USER, 'acct-1', { nickname: 'New Name' });
      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.nickname).toBe('New Name');
    });
  });

  // ─── freeze ──────────────────────────────────────────────────────

  describe('freeze', () => {
    it('should freeze the account', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.updateStatus.mockResolvedValue(
        makeAccount({ status: 'FROZEN', freezeReason: 'FRAUD_ALERT' }),
      );

      const result = await controller.freeze(ADMIN_USER, 'acct-1', {
        reason: 'FRAUD_ALERT' as never,
      });
      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.status).toBe('FROZEN');
    });
  });

  // ─── unfreeze ────────────────────────────────────────────────────

  describe('unfreeze', () => {
    it('should unfreeze the account', async () => {
      repository.findById.mockResolvedValue(makeAccount({ status: 'FROZEN' }));
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));

      const result = await controller.unfreeze(ADMIN_USER, 'acct-1');
      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.status).toBe('ACTIVE');
    });
  });

  // ─── close ───────────────────────────────────────────────────────

  describe('close', () => {
    it('should close the account', async () => {
      repository.findById.mockResolvedValue(
        makeAccount({ currentBalance: new Decimal(0), availableBalance: new Decimal(0) }),
      );
      repository.isAccountHolder.mockResolvedValue(true);
      repository.updateStatus.mockResolvedValue(
        makeAccount({ status: 'CLOSED', closedAt: new Date(), closureReason: 'USER_REQUEST' }),
      );

      const result = await controller.close(USER, 'acct-1', { reason: 'USER_REQUEST' as never });
      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.status).toBe('CLOSED');
    });
  });

  // ─── lock ────────────────────────────────────────────────────────

  describe('lock', () => {
    it('should lock the account', async () => {
      repository.findById.mockResolvedValue(makeAccount());
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'LOCKED' }));

      const result = await controller.lock(ADMIN_USER, 'acct-1', { reason: 'Security concern' });
      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.status).toBe('LOCKED');
    });
  });

  // ─── unlock ──────────────────────────────────────────────────────

  describe('unlock', () => {
    it('should unlock the account', async () => {
      repository.findById.mockResolvedValue(makeAccount({ status: 'LOCKED' }));
      repository.updateStatus.mockResolvedValue(makeAccount({ status: 'ACTIVE' }));

      const result = await controller.unlock(ADMIN_USER, 'acct-1', {});
      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.status).toBe('ACTIVE');
    });
  });

  // ─── archive ─────────────────────────────────────────────────────

  describe('archive', () => {
    it('should archive the account', async () => {
      repository.findById.mockResolvedValueOnce(makeAccount({ status: 'CLOSED' }));
      repository.softDelete.mockResolvedValue(undefined);
      repository.findById.mockResolvedValueOnce(makeAccount({ status: 'ARCHIVED' }));

      const result = await controller.archive(ADMIN_USER, 'acct-1');
      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(result.status).toBe('ARCHIVED');
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

      const result = await controller.getBalance(USER, 'acct-1');
      expect(result.current).toBe('1000');
      expect(result.available).toBe('900');
      expect(result.pending).toBe('100');
      expect(result.held).toBe('50');
      expect(result.ledger).toBe('1100');
      expect(result.currency).toBe('USD');
    });
  });

  // ─── getAvailableBalance ────────────────────────────────────────

  describe('getAvailableBalance', () => {
    it('should return available balance', async () => {
      repository.findById.mockResolvedValue(makeAccount({ availableBalance: new Decimal(500) }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await controller.getAvailableBalance(USER, 'acct-1');
      expect(result.available).toBe('500');
      expect(result.currency).toBe('USD');
    });
  });

  // ─── getCurrentBalance ──────────────────────────────────────────

  describe('getCurrentBalance', () => {
    it('should return current balance', async () => {
      repository.findById.mockResolvedValue(makeAccount({ currentBalance: new Decimal(750) }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await controller.getCurrentBalance(USER, 'acct-1');
      expect(result.current).toBe('750');
      expect(result.currency).toBe('USD');
    });
  });

  // ─── getStatements ──────────────────────────────────────────────

  describe('getStatements', () => {
    it('should return statements', async () => {
      const createdAt = new Date('2025-01-15');
      repository.findById.mockResolvedValue(makeAccount({ createdAt }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await controller.getStatements(USER, 'acct-1');
      expect(result.accountId).toBe('acct-1');
      expect(result.statements.length).toBeGreaterThan(0);
      expect(result.statements[0]).toHaveProperty('periodStart');
    });

    it('should accept query parameters', async () => {
      const createdAt = new Date('2024-01-01');
      repository.findById.mockResolvedValue(makeAccount({ createdAt }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await controller.getStatements(USER, 'acct-1', undefined, undefined, '1', '3');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(3);
      expect(result.statements.length).toBeLessThanOrEqual(3);
    });
  });

  // ─── getHolds ───────────────────────────────────────────────────

  describe('getHolds', () => {
    it('should return holds with aggregate amount', async () => {
      repository.findById.mockResolvedValue(makeAccount({ holdAmount: new Decimal(250) }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await controller.getHolds(USER, 'acct-1');
      expect(result.accountId).toBe('acct-1');
      expect(result.totalHeldAmount).toBe('250');
      expect(result.holds).toHaveLength(1);
      expect(result.holds[0]!.amount).toBe('250'); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    });

    it('should return empty holds when holdAmount is zero', async () => {
      repository.findById.mockResolvedValue(makeAccount({ holdAmount: new Decimal(0) }));
      repository.isAccountHolder.mockResolvedValue(true);

      const result = await controller.getHolds(USER, 'acct-1');
      expect(result.holds).toHaveLength(0);
      expect(result.totalHeldAmount).toBe('0');
    });
  });
});
