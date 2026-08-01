const { execSync } = require('child_process');

try {
  console.log('--- Staging pnpm-lock.yaml ---');
  execSync('git add pnpm-lock.yaml', { stdio: 'inherit' });

  console.log('--- Committing ---');
  execSync('git commit -m "fix: synchronize pnpm workspace lockfile"', { stdio: 'inherit' });

  console.log('--- Pushing to origin main ---');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('--- Getting commit hash ---');
  const hash = execSync('git rev-parse HEAD').toString().trim();
  console.log('Commit hash:', hash);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}