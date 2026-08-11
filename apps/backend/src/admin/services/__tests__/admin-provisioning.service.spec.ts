import { Logger } from '@nestjs/common';
import type { PrismaService } from '../../../prisma/prisma.service';
import { AdminProvisioningService } from '../admin-provisioning.service';
import {
  provisionAdmin,
  resolveBootstrapConfig,
} from '../admin-provisioning.core';

type PrismaMock = {
  user: { findFirst: jest.Mock; update: jest.Mock };
  adminRole: { upsert: jest.Mock };
  adminUser: { upsert: jest.Mock };
  adminUserRole: { upsert: jest.Mock };
};

const REGISTERED_USER = {
  id: 'user-1',
  email: 'ops@example.com',
  firstName: 'Ada',
  lastName: 'Ops',
  passwordHash: 'argon2-hash-must-never-change',
};

function createPrismaMock(user: unknown = REGISTERED_USER): PrismaMock {
  return {
    user: {
      findFirst: jest.fn().mockResolvedValue(user),
      update: jest.fn(),
    },
    adminRole: { upsert: jest.fn().mockResolvedValue({ id: 'role-1', name: 'SUPER_ADMIN' }) },
    adminUser: { upsert: jest.fn().mockResolvedValue({ id: 'admin-1' }) },
    adminUserRole: { upsert: jest.fn().mockResolvedValue({ id: 'aur-1' }) },
  };
}

function serviceWith(prisma: PrismaMock): AdminProvisioningService {
  return new AdminProvisioningService(prisma as unknown as PrismaService);
}

describe('resolveBootstrapConfig', () => {
  it('is disabled when ADMIN_BOOTSTRAP_ENABLED is absent', () => {
    expect(resolveBootstrapConfig({})).toEqual({ ok: true, config: { enabled: false } });
  });

  it('is disabled when ADMIN_BOOTSTRAP_ENABLED is not exactly "true"', () => {
    expect(resolveBootstrapConfig({ ADMIN_BOOTSTRAP_ENABLED: '1' })).toEqual({
      ok: true,
      config: { enabled: false },
    });
  });

  it('enables with the default role and normalizes the email', () => {
    expect(
      resolveBootstrapConfig({
        ADMIN_BOOTSTRAP_ENABLED: 'true',
        ADMIN_BOOTSTRAP_EMAIL: 'Ops@Example.com',
      }),
    ).toEqual({ ok: true, config: { enabled: true, email: 'ops@example.com', roleName: 'SUPER_ADMIN' } });
  });

  it('rejects an enabled config with no email', () => {
    const result = resolveBootstrapConfig({ ADMIN_BOOTSTRAP_ENABLED: 'true' });
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown role', () => {
    const result = resolveBootstrapConfig({
      ADMIN_BOOTSTRAP_ENABLED: 'true',
      ADMIN_BOOTSTRAP_EMAIL: 'ops@example.com',
      ADMIN_BOOTSTRAP_ROLE: 'ROOT',
    });
    expect(result.ok).toBe(false);
  });
});

describe('AdminProvisioningService.runStartupBootstrap', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. Bootstrap disabled → no action.
  it('does nothing when the bootstrap is disabled', async () => {
    const prisma = createPrismaMock();
    await serviceWith(prisma).runStartupBootstrap({});

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.adminUser.upsert).not.toHaveBeenCalled();
  });

  // 2. Bootstrap enabled + existing user → admin created.
  it('provisions the admin when enabled and the user exists', async () => {
    const prisma = createPrismaMock();
    await serviceWith(prisma).runStartupBootstrap({
      ADMIN_BOOTSTRAP_ENABLED: 'true',
      ADMIN_BOOTSTRAP_EMAIL: 'ops@example.com',
    });

    expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.adminRole.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.adminUser.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.adminUserRole.upsert).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      'Admin bootstrap successfully provisioned ops@example.com',
    );
  });

  // 3. Bootstrap runs twice → no duplicate admin record.
  it('is idempotent across repeated runs (upsert, never a blind create)', async () => {
    const prisma = createPrismaMock();
    const env = { ADMIN_BOOTSTRAP_ENABLED: 'true', ADMIN_BOOTSTRAP_EMAIL: 'ops@example.com' };

    await serviceWith(prisma).runStartupBootstrap(env);
    await serviceWith(prisma).runStartupBootstrap(env);

    // Every write goes through upsert keyed by a unique constraint, so a second
    // run cannot create a duplicate admin_users or admin_user_roles row.
    expect(prisma.adminUser.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.adminUser.upsert.mock.calls[0][0].where).toEqual({ userId: 'user-1' });
    expect(prisma.adminUserRole.upsert.mock.calls[0][0].where).toEqual({
      adminUserId_roleId: { adminUserId: 'admin-1', roleId: 'role-1' },
    });
  });

  // 4. User does not exist → no admin created.
  it('creates no admin when the user is not registered', async () => {
    const prisma = createPrismaMock(null);
    await serviceWith(prisma).runStartupBootstrap({
      ADMIN_BOOTSTRAP_ENABLED: 'true',
      ADMIN_BOOTSTRAP_EMAIL: 'ghost@example.com',
    });

    expect(prisma.adminRole.upsert).not.toHaveBeenCalled();
    expect(prisma.adminUser.upsert).not.toHaveBeenCalled();
    expect(prisma.adminUserRole.upsert).not.toHaveBeenCalled();
    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      expect.stringContaining('no registered user found for ghost@example.com'),
    );
  });

  // 5. Existing password remains unchanged.
  it('never touches the user record or any password field', async () => {
    const prisma = createPrismaMock();
    await serviceWith(prisma).runStartupBootstrap({
      ADMIN_BOOTSTRAP_ENABLED: 'true',
      ADMIN_BOOTSTRAP_EMAIL: 'ops@example.com',
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
    const serialized = JSON.stringify([
      prisma.adminRole.upsert.mock.calls,
      prisma.adminUser.upsert.mock.calls,
      prisma.adminUserRole.upsert.mock.calls,
    ]);
    expect(serialized.toLowerCase()).not.toContain('password');
  });

  // 6. Normal users remain normal users.
  it('grants admin only to the exact bootstrap email, not to users at large', async () => {
    const prisma = createPrismaMock();
    await serviceWith(prisma).runStartupBootstrap({
      ADMIN_BOOTSTRAP_ENABLED: 'true',
      ADMIN_BOOTSTRAP_EMAIL: 'ops@example.com',
    });

    const where = prisma.user.findFirst.mock.calls[0][0].where;
    expect(where.email).toEqual({ equals: 'ops@example.com', mode: 'insensitive' });
    // Only the single matched user is linked as an admin.
    expect(prisma.adminUser.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.adminUser.upsert.mock.calls[0][0].create.userId).toBe('user-1');
  });

  it('logs and swallows provisioning errors so startup never fails', async () => {
    const prisma = createPrismaMock();
    prisma.user.findFirst.mockRejectedValueOnce(new Error('db down'));

    await expect(
      serviceWith(prisma).runStartupBootstrap({
        ADMIN_BOOTSTRAP_ENABLED: 'true',
        ADMIN_BOOTSTRAP_EMAIL: 'ops@example.com',
      }),
    ).resolves.toBeUndefined();

    expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining('Admin bootstrap failed'));
  });
});

describe('provisionAdmin', () => {
  it('returns a granted result linking the matched user and role', async () => {
    const prisma = createPrismaMock();
    const result = await provisionAdmin(prisma as unknown as never, {
      email: 'ops@example.com',
      roleName: 'SUPER_ADMIN',
    });

    expect(result).toEqual({
      status: 'granted',
      email: 'ops@example.com',
      userId: 'user-1',
      roleName: 'SUPER_ADMIN',
    });
  });

  it('returns user_not_found without writing when no user matches', async () => {
    const prisma = createPrismaMock(null);
    const result = await provisionAdmin(prisma as unknown as never, {
      email: 'ghost@example.com',
      roleName: 'SUPER_ADMIN',
    });

    expect(result).toEqual({ status: 'user_not_found', email: 'ghost@example.com' });
    expect(prisma.adminUser.upsert).not.toHaveBeenCalled();
  });
});
