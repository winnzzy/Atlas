/**
 * Safe initial-admin provisioning (CLI).
 *
 * This is a thin wrapper around the shared provisioning core used by the
 * application's startup bootstrap — there is only one implementation. It never
 * sets or stores a password: the target person registers normally through
 * /signup (choosing their own password), and this only grants them an admin role
 * by writing to the admin_users tables that AdminAuthGuard and RolesGuard read.
 *
 * Prefer the environment-based startup bootstrap (ADMIN_BOOTSTRAP_ENABLED=true)
 * on hosts without shell access. Use this CLI when you do have a shell and the
 * production DATABASE_URL in the environment:
 *
 *   ADMIN_BOOTSTRAP_EMAIL=you@example.com pnpm --filter @atlas/backend admin:provision
 *
 * Optional:
 *   ADMIN_BOOTSTRAP_ROLE=SUPER_ADMIN   (default; one of SUPPORT, OPERATIONS,
 *                                        COMPLIANCE, FINANCE, ADMIN, SUPER_ADMIN)
 *
 * The operation is idempotent: re-running re-asserts the same grant.
 */
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_ADMIN_ROLE,
  VALID_ADMIN_ROLES,
  isAdminRoleName,
  provisionAdmin,
} from '../src/admin/services/admin-provisioning.core';

async function main(): Promise<void> {
  const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const roleName = (process.env.ADMIN_BOOTSTRAP_ROLE || DEFAULT_ADMIN_ROLE).trim().toUpperCase();

  if (!email) {
    console.error('ADMIN_BOOTSTRAP_EMAIL is required (the email of an already-registered user).');
    process.exit(1);
  }
  if (!isAdminRoleName(roleName)) {
    console.error(`ADMIN_BOOTSTRAP_ROLE must be one of: ${VALID_ADMIN_ROLES.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set; point it at the target database and retry.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const result = await provisionAdmin(prisma, { email, roleName });
    if (result.status === 'user_not_found') {
      console.error(
        `No registered user found for ${email}. Register that account through /signup first, then re-run.`,
      );
      process.exit(1);
    }

    console.log('Admin access granted.');
    console.log(`  user:  ${result.email} (${result.userId})`);
    console.log(`  role:  ${result.roleName}`);
    console.log('The user can now sign in normally and will be routed to /admin.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Provisioning failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
