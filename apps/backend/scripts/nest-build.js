const { spawnSync } = require('node:child_process');

// Decouple the build-time heap from the runtime heap. Render sets a small
// NODE_OPTIONS=--max-old-space-size for the low-memory runtime instance, but the
// TypeScript compiler that `nest build` runs needs ~470MB+, so it OOMs under
// that cap. Raise the heap just for this compile step; the runtime
// (`node dist/main`) keeps whatever Render configures.
const heapMb = process.env.BUILD_HEAP_MB || '1024';
const passthrough = (process.env.NODE_OPTIONS || '')
  .split(' ')
  .filter((flag) => flag && !flag.startsWith('--max-old-space-size'))
  .join(' ');
const nodeOptions = `${passthrough} --max-old-space-size=${heapMb}`.trim();

const nestCli = require.resolve('@nestjs/cli/bin/nest.js');

const result = spawnSync(process.execPath, [nestCli, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
