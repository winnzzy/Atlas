const { execSync } = require('child_process');
try {
  const output = execSync('npx tsc --noEmit', {
    cwd: 'apps/backend',
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 50 * 1024 * 1024,
  });
  console.log(output || 'No errors');
} catch (e) {
  console.log(e.stdout || '');
  console.log(e.stderr || '');
}