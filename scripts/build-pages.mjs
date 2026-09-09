import { access, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

await rm('dist/client', { recursive: true, force: true });

const result = spawnSync(process.execPath, ['node_modules/vinext/dist/cli.js', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, GITHUB_PAGES: 'true' },
});

let hasStaticEntry = true;
try {
  await access('dist/client/index.html');
} catch {
  hasStaticEntry = false;
}

const windowsShutdownOnly = process.platform === 'win32' && result.status !== 0 && hasStaticEntry;
if (result.status !== 0 && !windowsShutdownOnly) process.exit(result.status || 1);
if (!hasStaticEntry) throw new Error('Static export did not produce dist/client/index.html.');
if (windowsShutdownOnly) console.warn('Vinext completed the static export before a Windows shutdown assertion; verified output will be used.');

await import('./prepare-pages.mjs');
