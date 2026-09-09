import { access, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

await rm('pages-dist', { recursive: true, force: true });

const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.pages.config.ts'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) process.exit(result.status || 1);

try {
  await access('pages-dist/index.html');
} catch {
  throw new Error('GitHub Pages build did not produce pages-dist/index.html.');
}

await import('./prepare-pages.mjs');
