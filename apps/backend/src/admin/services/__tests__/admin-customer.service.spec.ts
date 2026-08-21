import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { AccountService } from '../../../accounts/services/account.service';
import type { NotificationService } from '../../../notifications/services/notification.service';
import type { PrismaService } from '../../../prisma/prisma.service';
import { AdminCustomerService } from '../admin-customer.service';
import type { AdminPresentationService } from '../admin-presentation.service';
import type { AdminHistoryGeneratorService } from '../admin-history-generator.service';

const CUSTOMER = {
  id: 'user-1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  phoneNumber: '+15550100',
  status: 'ACTIVE',
  kycStatus: 'PENDING',
  kycLevel: 'LEVEL_0',
  emailVerified: true,
  phoneVerified: false,
  metadata: { profile: { address: { city: 'Old City' } } },
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
};

function buildPrisma(customer: Record<string, unknown> | null = CUSTOMER) {
  const tx = {
    user: { update: jest.fn().mockResolvedValue({ ...CUSTOMER, kycStatus: 'APPROVED' }) },
    kycDocument: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
  return {
    user: {
      findFirst: jest.fn().mockResolvedValue(customer),
      findUnique: jest.fn().mockResolvedValue(customer),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...CUSTOMER, ...data })),
    },
    kycDocument: { updateMany: jest.fn() },
    adminAction: {
      create: jest.fn().mockResolvedValue({ id: 'action-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    accountHolder: {
      findMany: jest.fn().mockResolvedValue([{ accountId: 'acc-1' }]),
      findFirst: jest.fn().mockResolvedValue({ userId: 'user-1' }),
    },
    $transaction: jest.fn().mockImplementation((cb: (t: typeof tx) => unknown) => cb(tx)),
    __tx: tx,
  };
}

function build(prisma: ReturnType<typeof buildPrisma>) {
  const accountService = {
    adminAssignAccount: jest.fn().mockResolvedValue({ id: 'acc-1', accountNumber: '0000001234' }),
    applyRestriction: jest.fn().mockResolvedValue({ id: 'acc-1', status: 'RESTRICTED' }),
    releaseRestriction: jest.fn().mockResolvedValue({ id: 'acc-1', status: 'ACTIVE' }),
  };
  const notificationService = { notifyDirect: jest.fn().mockResolvedValue(null) };
  const presentationService = {
    getStatus: jest.fn().mockResolvedValue({ presentationExists: false }),
    generate: jest.fn().mockResolvedValue({
      accountId: 'acc-1',
      batchId: 'batch-1',
      transactionCount: 42,
      openingBalance: '0.00',
      finalBalance: '4700000.00',
      totalCredits: '4800000.00',
      totalDebits: '100000.00',
      periodStart: '2026-02-11T00:00:00.000Z',
      periodEnd: '2026-08-11T00:00:00.000Z',
      replaced: false,
    }),
  };
  const historyGeneratorService = {
    generateHistory: jest.fn().mockResolvedValue({
      accountId: 'acc-1',
      batchId: 'hist-batch-1',
      transactionCount: 24,
      totalCredits: '5000.00',
      totalDebits: '5000.00',
      periodStart: '2026-02-11T00:00:00.000Z',
      periodEnd: '2026-08-11T00:00:00.000Z',
    }),
  };
  const service = new AdminCustomerService(
    prisma as unknown as PrismaService,
    accountService as unknown as AccountService,
    notificationService as unknown as NotificationService,
    presentationService as unknown as AdminPresentationService,
    historyGeneratorService as unknown as AdminHistoryGeneratorService,
  );
  return {
    service,
    accountService,
    notificationService,
    presentationService,
    historyGeneratorService,
  };
}

describe('AdminCustomerService', () => {
  it('updates supported customer fields and records an audit action', async () => {
    const prisma = buildPrisma();
    const { service } = build(prisma);

    await service.updateCustomer('admin-1', 'user-1', {
      firstName: 'Janet',
      address: { city: 'New City' },
    });

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.firstName).toBe('Janet');
    // Existing metadata is merged, not wiped.
    expect(data.metadata.profile.address.city).toBe('New City');
    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'CUSTOMER_UPDATE', adminUserId: 'admin-1' }),
      }),
    );
    // Password is never part of the update payload.
    expect(JSON.stringify(data).toLowerCase()).not.toContain('password');
  });

  it('rejects an email change that collides with another customer', async () => {
    const prisma = buildPrisma();
    prisma.user.findFirst
      .mockResolvedValueOnce(CUSTOMER) // requireUser
      .mockResolvedValueOnce({ id: 'other' }); // clash check
    const { service } = build(prisma);

    await expect(
      service.updateCustomer('admin-1', 'user-1', { email: 'taken@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('approves KYC, persists it, audits it and notifies the customer', async () => {
    const prisma = buildPrisma();
    const { service, notificationService } = build(prisma);

    const result = await service.decideKyc('admin-1', 'user-1', { decision: 'APPROVE' });

    expect(prisma.__tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kycStatus: 'APPROVED' }) }),
    );
    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'KYC_APPROVE' }) }),
    );
    expect(notificationService.notifyDirect).toHaveBeenCalledTimes(1);
    expect(result.kycStatus).toBe('APPROVED');
    expect(result.reviewedBy).toBe('admin-1');
  });

  it('requires a reason to reject KYC', async () => {
    const prisma = buildPrisma();
    const { service } = build(prisma);

    await expect(
      service.decideKyc('admin-1', 'user-1', { decision: 'REJECT' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects KYC with a reason and audits it', async () => {
    const prisma = buildPrisma();
    const { service } = build(prisma);

    const result = await service.decideKyc('admin-1', 'user-1', {
      decision: 'REJECT',
      reason: 'blurry id',
    });

    expect(result.kycStatus).toBe('REJECTED');
    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'KYC_REJECT' }) }),
    );
  });

  it('assigns an account through the account service and audits it', async () => {
    const prisma = buildPrisma();
    const { service, accountService, notificationService } = build(prisma);

    const account = await service.assignAccount('admin-1', 'ADMIN', 'user-1', {
      accountType: 'CHECKING',
    });

    expect(accountService.adminAssignAccount).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'admin-1', role: 'ADMIN' }),
      'user-1',
      expect.objectContaining({ accountType: 'CHECKING' }),
    );
    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'ACCOUNT_ASSIGN' }) }),
    );
    expect(notificationService.notifyDirect).toHaveBeenCalled();
    expect(account.id).toBe('acc-1');
  });

  it('generates presentation activity and records an audit action', async () => {
    const prisma = buildPrisma();
    const { service, presentationService } = build(prisma);

    const result = await service.generatePresentation('admin-1', 'user-1', { accountId: 'acc-1' });

    expect(presentationService.generate).toHaveBeenCalledWith('user-1', { accountId: 'acc-1' });
    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'PRESENTATION_GENERATE',
          adminUserId: 'admin-1',
          resourceId: 'acc-1',
          details: expect.objectContaining({
            targetBalance: '4700000.00',
            transactionCount: 42,
          }),
        }),
      }),
    );
    expect(result.finalBalance).toBe('4700000.00');
  });

  it('removes (deactivates) a customer, preserving records, and audits it', async () => {
    const prisma = buildPrisma();
    const { service } = build(prisma);

    const result = await service.removeCustomer('admin-1', 'user-1', 'fraud review');

    // Soft removal: the row is retained but marked deleted + CLOSED so it drops
    // out of active lists and login is blocked. No hard delete of financials.
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.deletedAt).toBeInstanceOf(Date);
    expect(data.status).toBe('CLOSED');
    expect(prisma.adminAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CUSTOMER_REMOVE',
          adminUserId: 'admin-1',
          resourceType: 'USER',
          resourceId: 'user-1',
          details: expect.objectContaining({
            reason: 'fraud review',
            financialRecordsPreserved: true,
          }),
        }),
      }),
    );
    expect(result).toEqual(expect.objectContaining({ removed: true, status: 'CLOSED' }));
  });

  it('rejects removing a customer that does not exist or is already removed', async () => {
    const prisma = buildPrisma(null);
    const { service } = build(prisma);

    await expect(service.removeCustomer('admin-1', 'ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // Nothing is mutated and no audit action is written on a failed lookup.
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.adminAction.create).not.toHaveBeenCalled();
  });

  it('applies and releases an account restriction with audit + notification', async () => {
    const prisma = buildPrisma();
    const { service, accountService, notificationService } = build(prisma);

    await service.applyRestriction('admin-1', 'ADMIN', 'acc-1', { reason: 'court order' });
    expect(accountService.applyRestriction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'admin-1' }),
      'acc-1',
      'court order',
    );

    await service.releaseRestriction('admin-1', 'ADMIN', 'acc-1');
    expect(accountService.releaseRestriction).toHaveBeenCalled();

    expect(prisma.adminAction.create).toHaveBeenCalledTimes(2);
    expect(notificationService.notifyDirect).toHaveBeenCalledTimes(2);
  });
});
