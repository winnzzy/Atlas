import type { PrismaClient } from '@prisma/client';

/**
 * Single source of truth for admin provisioning.
 *
 * This module is deliberately free of NestJS so it can be shared by both the
 * startup bootstrap (AdminProvisioningService) and the CLI script. It never
 * creates a user, never sets or reads a password, and only ever grants an admin
 * role to the exact user identified by an email. The admin grant is written to
 * the admin_users tables that AdminAuthGuard and RolesGuard read, so authority
 * is always derived server-side.
 */

export const VALID_ADMIN_ROLES = [
  'SUPPORT',
  'OPERATIONS',
  'COMPLIANCE',
  'FINANCE',
  'ADMIN',
  'SUPER_ADMIN',
] as const;

export type AdminRoleName = (typeof VALID_ADMIN_ROLES)[number];

export const DEFAULT_ADMIN_ROLE: AdminRoleName = 'SUPER_ADMIN';

export function isAdminRoleName(value: string): value is AdminRoleName {
  return (VALID_ADMIN_ROLES as readonly string[]).includes(value);
}

export type BootstrapConfig =
  | { enabled: false }
  | { enabled: true; email: string; roleName: AdminRoleName };

export type BootstrapConfigResult =
  | { ok: true; config: BootstrapConfig }
  | { ok: false; error: string };

/**
 * Interprets the ADMIN_BOOTSTRAP_* environment variables.
 *
 * Provisioning only runs when ADMIN_BOOTSTRAP_ENABLED is exactly "true"; any
 * other value (including unset) resolves to a disabled config so the startup
 * hook does nothing.
 */
export function resolveBootstrapConfig(
  env: Record<string, string | undefined>,
): BootstrapConfigResult {
  const enabled = (env.ADMIN_BOOTSTRAP_ENABLED ?? '').trim().toLowerCase() === 'true';
  if (!enabled) {
    return { ok: true, config: { enabled: false } };
  }

  const email = (env.ADMIN_BOOTSTRAP_EMAIL ?? '').trim().toLowerCase();
  if (!email) {
    return {
      ok: false,
      error: 'ADMIN_BOOTSTRAP_ENABLED is true but ADMIN_BOOTSTRAP_EMAIL is not set.',
    };
  }

  const roleName = (env.ADMIN_BOOTSTRAP_ROLE ?? DEFAULT_ADMIN_ROLE).trim().toUpperCase();
  if (!isAdminRoleName(roleName)) {
    return {
      ok: false,
      error: `ADMIN_BOOTSTRAP_ROLE must be one of: ${VALID_ADMIN_ROLES.join(', ')}`,
    };
  }

  return { ok: true, config: { enabled: true, email, roleName } };
}

export type ProvisionResult =
  | { status: 'granted'; email: string; userId: string; roleName: AdminRoleName }
  | { status: 'user_not_found'; email: string };

/**
 * Idempotently grants an admin role to an already-registered user.
 *
 * - Looks the user up by email; if none exists, returns without writing anything.
 * - Upserts the role, the admin_users link, and the admin_user_roles join row,
 *   so re-running produces no duplicates and never overwrites the user record.
 * - Does not touch the user's password or any other user field.
 */
export async function provisionAdmin(
  prisma: PrismaClient,
  input: { email: string; roleName: AdminRoleName },
): Promise<ProvisionResult> {
  const email = input.email.trim().toLowerCase();
  const { roleName } = input;

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
  });
  if (!user) {
    return { status: 'user_not_found', email };
  }

  const role = await prisma.adminRole.upsert({
    where: { name: roleName },
    create: { name: roleName, description: `${roleName} administrator`, isSystem: true },
    update: {},
  });

  const adminUser = await prisma.adminUser.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      email: user.email,
      firstName: user.firstName || 'Atlas',
      lastName: user.lastName || 'Administrator',
      status: 'ACTIVE',
    },
    update: { status: 'ACTIVE', deletedAt: null },
  });

  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: adminUser.id, roleId: role.id } },
    create: { adminUserId: adminUser.id, roleId: role.id },
    update: {},
  });

  return { status: 'granted', email: user.email, userId: user.id, roleName };
}
