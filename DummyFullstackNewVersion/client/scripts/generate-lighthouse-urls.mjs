// Write Lighthouse CI URLs to .lighthouse-urls.json
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PUBLIC_STATIC_ROUTES } from '../src/utils/constants/routes.js';

// Separate from the 4173 preview/e2e port
export const LHCI_PORT = 4174;

const base = `http://localhost:${LHCI_PORT}`;
const urls = PUBLIC_STATIC_ROUTES.map((route) => `${base}${route}`);

await writeFile(resolve('.lighthouse-urls.json'), JSON.stringify(urls), 'utf8');
console.log(`✅ Wrote ${urls.length} URLs to .lighthouse-urls.json`);
