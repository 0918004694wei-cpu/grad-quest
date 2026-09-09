import { access, copyFile, cp, mkdir, rm, writeFile } from 'node:fs/promises';

const source = 'dist/client';
const output = 'pages-dist';

await access(`${source}/index.html`);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
await copyFile(`${output}/index.html`, `${output}/404.html`);
await writeFile(`${output}/.nojekyll`, '');

console.log('GitHub Pages fallback and .nojekyll are ready.');
