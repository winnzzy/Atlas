const { spawnSync } = require('node:child_process');

if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL is not set; skipping Prisma schema push.');
  process.exit(0);
}

const result = spawnSync(
  'prisma',
  ['db', 'push', '--schema=prisma/schema.prisma', '--skip-generate'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
