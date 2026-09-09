import { access, copyFile, writeFile } from 'node:fs/promises';

const output = 'pages-dist';

await access(`${output}/index.html`);
await copyFile(`${output}/index.html`, `${output}/404.html`);
await writeFile(`${output}/.nojekyll`, '');

console.log('GitHub Pages fallback and .nojekyll are ready.');
