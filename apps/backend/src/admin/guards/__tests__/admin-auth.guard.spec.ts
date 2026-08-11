import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuthGuard } from '../admin-auth.guard';

/**
 * Scenario 7 from the bootstrap spec: the guard must recognize an admin that the
 * provisioning path produced — an ACTIVE admin_users row linked to a role — while
 * still refusing a normal user with no admin_users row.
 */
function contextWithToken(token = 'valid-token'): { context: ExecutionContext; request: { headers: Record<string, string> } } {
  const request = { headers: { authorization: `Bearer ${token}` } as Record<string, string> };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

function guardWith(adminUser: unknown): { guard: AdminAuthGuard; prisma: { adminUser: { findFirst: jest.Mock } } } {
  const jwtService = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1' }) } as unknown as JwtService;
  const configService = { get: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;
  const prisma = { adminUser: { findFirst: jest.fn().mockResolvedValue(adminUser) } };
  const guard = new AdminAuthGuard(jwtService, configService, prisma as unknown as PrismaService);
  return { guard, prisma };
}

describe('AdminAuthGuard', () => {
  it('recognizes a provisioned admin and exposes the derived role server-side', async () => {
    // Shape mirrors what provisionAdmin writes: ACTIVE admin_users + a role row.
    const provisionedAdmin = {
      id: 'admin-1',
      status: 'ACTIVE',
      adminRoles: [{ role: { name: 'SUPER_ADMIN' } }],
    };
    const { guard, prisma } = guardWith(provisionedAdmin);
    const { context, request } = contextWithToken();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.adminUser.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1', status: 'ACTIVE' }) }),
    );
    expect(request.headers['x-admin-role']).toBe('SUPER_ADMIN');
    expect(request.headers['x-admin-id']).toBe('admin-1');
  });

  it('refuses a normal user who has no admin_users row', async () => {
    const { guard } = guardWith(null);
    const { context } = contextWithToken();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
