/**
 * Postinstall script — copies Tesseract.js assets from node_modules
 * into public/tesseract/ so the app can serve them locally (offline).
 *
 * Runs automatically after `npm install`.
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dest = resolve(root, 'public', 'tesseract');
const langDest = resolve(dest, 'lang-data');

mkdirSync(dest, { recursive: true });
mkdirSync(langDest, { recursive: true });

const filesToCopy = [
  {
    src: 'node_modules/tesseract.js/dist/worker.min.js',
    dst: 'worker.min.js',
  },
  {
    src: 'node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
    dst: 'tesseract-core-simd-lstm.wasm.js',
  },
  {
    src: 'node_modules/tesseract.js-core/tesseract-core-simd.wasm.js',
    dst: 'tesseract-core-simd.wasm.js',
  },
  {
    src: 'node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js',
    dst: 'tesseract-core-lstm.wasm.js',
  },
  {
    src: 'node_modules/tesseract.js-core/tesseract-core.wasm.js',
    dst: 'tesseract-core.wasm.js',
  },
];

let copied = 0;
for (const { src, dst } of filesToCopy) {
  const srcPath = resolve(root, src);
  const dstPath = resolve(dest, dst);
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, dstPath);
    copied++;
  } else {
    console.warn(`[postinstall] WARNING: ${src} not found, skipping`);
  }
}

if (!existsSync(resolve(langDest, 'eng.traineddata.gz'))) {
  console.warn(
    '[postinstall] WARNING: public/tesseract/lang-data/eng.traineddata.gz is missing.\n' +
    '  Download it manually for offline OCR:\n' +
    '  curl -o public/tesseract/lang-data/eng.traineddata.gz \\\n' +
    '    https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'
  );
}

console.log(`[postinstall] Copied ${copied}/${filesToCopy.length} Tesseract assets to public/tesseract/`);
