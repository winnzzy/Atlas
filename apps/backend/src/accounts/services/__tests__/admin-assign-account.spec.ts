import { ForbiddenException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import type { AccountRepository } from '../../repositories/account.repository';
import { AccountPolicy } from '../../policies/account.policy';
import { AccountService } from '../account.service';

function fullAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acc-1',
    accountNumber: '0000001234',
    routingNumber: '021000021',
    type: 'CHECKING',
    status: 'ACTIVE',
    name: 'Checking Account',
    nickname: null,
    currency: 'USD',
    currentBalance: new Decimal(0),
    availableBalance: new Decimal(0),
    pendingBalance: new Decimal(0),
    holdAmount: new Decimal(0),
    overdraftLimit: new Decimal(0),
    dailyLimit: new Decimal(5000),
    monthlyLimit: new Decimal(25000),
    interestRate: null,
    freezeReason: null,
    freezeNote: null,
    closedAt: null,
    closureReason: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function buildService(repoOverrides: Record<string, jest.Mock> = {}) {
  const repository = {
    findByUserId: jest.fn().mockResolvedValue({ accounts: [], total: 0 }),
    findByAccountNumber: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(fullAccount({ status: 'PENDING' })),
    updateStatus: jest.fn().mockResolvedValue(fullAccount({ status: 'ACTIVE' })),
    ...repoOverrides,
  };
  const service = new AccountService(repository as unknown as AccountRepository, new AccountPolicy());
  return { service, repository };
}

const ADMIN = { id: 'admin-1', email: 'admin@atlas.internal', role: 'ADMIN' };

describe('AccountService.adminAssignAccount', () => {
  it('creates a zero-balance account with a server-generated unique number', async () => {
    const { service, repository } = buildService();

    const result = await service.adminAssignAccount(ADMIN as never, 'user-1', { accountType: 'CHECKING' });

    // Account number is generated server-side and checked for uniqueness.
    expect(repository.findByAccountNumber).toHaveBeenCalled();
    const created = (repository.create.mock.calls[0]?.[0] ?? {}) as {
      userId?: string;
      accountNumber?: string;
    };
    expect(created.userId).toBe('user-1');
    expect(created.accountNumber ?? '').toMatch(/^\d{10}$/);
    // No client-supplied balance; starts at zero (repository seeds 0).
    expect(created).not.toHaveProperty('currentBalance');
    expect(result.status).toBe('ACTIVE');
  });

  it('retries generation until it finds an unused account number', async () => {
    const findByAccountNumber = jest
      .fn()
      .mockResolvedValueOnce(fullAccount()) // first candidate taken
      .mockResolvedValueOnce(null); // second candidate free
    const { service, repository } = buildService({ findByAccountNumber });

    await service.adminAssignAccount(ADMIN as never, 'user-1', { accountType: 'SAVINGS' });

    expect(repository.findByAccountNumber).toHaveBeenCalledTimes(2);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it('refuses assignment for a non-admin caller', async () => {
    const { service } = buildService();
    await expect(
      service.adminAssignAccount({ id: 'u', email: 'u@x', role: 'CUSTOMER' } as never, 'user-1', {
        accountType: 'CHECKING',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
