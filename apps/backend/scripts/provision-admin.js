/**
 * Safe initial-admin provisioning.
 *
 * There is no admin user until an operator with database access runs this. It
 * never sets or stores a password: the target person registers normally through
 * /signup (choosing their own password), and this script only grants them an
 * admin role by writing to the admin_users tables that AdminAuthGuard and
 * RolesGuard read. The admin grant is therefore always derived server-side.
 *
 * Usage (from apps/backend, with the production DATABASE_URL in the environment):
 *
 *   ADMIN_BOOTSTRAP_EMAIL=you@example.com node scripts/provision-admin.js
 *
 * Optional:
 *   ADMIN_BOOTSTRAP_ROLE=SUPER_ADMIN   (default; one of SUPPORT, OPERATIONS,
 *                                        COMPLIANCE, FINANCE, ADMIN, SUPER_ADMIN)
 *
 * The script is idempotent: re-running it re-asserts the same grant.
 */
const { PrismaClient } = require('@prisma/client');

const VALID_ROLES = ['SUPPORT', 'OPERATIONS', 'COMPLIANCE', 'FINANCE', 'ADMIN', 'SUPER_ADMIN'];

async function main() {
  const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const roleName = (process.env.ADMIN_BOOTSTRAP_ROLE || 'SUPER_ADMIN').trim().toUpperCase();

  if (!email) {
    console.error('ADMIN_BOOTSTRAP_EMAIL is required (the email of an already-registered user).');
    process.exit(1);
  }
  if (!VALID_ROLES.includes(roleName)) {
    console.error(`ADMIN_BOOTSTRAP_ROLE must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set; point it at the target database and retry.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
    });
    if (!user) {
      console.error(
        `No registered user found for ${email}. Register that account through /signup first, then re-run.`,
      );
      process.exit(1);
    }

    // Ensure the role row exists (isSystem so it is not treated as ad hoc).
    const role = await prisma.adminRole.upsert({
      where: { name: roleName },
      create: { name: roleName, description: `${roleName} administrator`, isSystem: true },
      update: {},
    });

    // Ensure the admin_users row is linked to this user and ACTIVE.
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

    // Link role to admin user (composite unique guards against duplicates).
    await prisma.adminUserRole.upsert({
      where: { adminUserId_roleId: { adminUserId: adminUser.id, roleId: role.id } },
      create: { adminUserId: adminUser.id, roleId: role.id },
      update: {},
    });

    console.log('Admin access granted.');
    console.log(`  user:  ${user.email} (${user.id})`);
    console.log(`  role:  ${roleName}`);
    console.log('The user can now sign in normally and will be routed to /admin.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Provisioning failed:', error.message);
  process.exit(1);
});
