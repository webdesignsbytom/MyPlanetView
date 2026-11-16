// Inlines each pre-rendered page's critical CSS (runs after prerender.mjs, on its output).
// Beasties finds the rules the page's HTML uses and puts them in a <style> in the head; the
// full stylesheet moves to the end of <body> (preload 'body'), so the page paints without
// waiting for it and no script is needed (the CSP allows no inline script). The app shell
// is skipped: its #root is empty until the app draws it, so it keeps the blocking link.
//
// Beasties can't tell which fonts the critical rules use (their families come through
// CSS variables), so every @font-face of the stylesheet is inlined too. Without them the
// first paint used a fallback font and the text moved when the stylesheet arrived.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Beasties from 'beasties';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const SKIP = new Set(['app-shell.html']);
const STYLESHEET = /<link[^>]+rel="stylesheet"[^>]+href="\/(assets\/[^"]+\.css)"/g;
const FONT_FACE = /@font-face\{[^}]*\}/g;

const beasties = new Beasties({
  path: dist,
  publicPath: '/',
  preload: 'body',
  pruneSource: false,
  inlineFonts: false, // added below instead
  preloadFonts: false, // index.html preloads the two every page draws
  compress: true,
  logLevel: 'warn',
});

// Every pre-rendered page, in subfolders too (the country guides are dist/countries/*.html)
async function htmlFiles(dir = dist, prefix = '') {
  const found = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory() && entry.name !== 'assets') found.push(...(await htmlFiles(path.join(dir, entry.name), file)));
    else if (entry.isFile() && entry.name.endsWith('.html') && !SKIP.has(file)) found.push(file);
  }
  return found;
}

async function run() {
  const pages = await htmlFiles();
  for (const file of pages) {
    const html = await fs.readFile(path.join(dist, file), 'utf8');
    const faces = [];
    for (const [, href] of html.matchAll(STYLESHEET)) {
      const css = await fs.readFile(path.join(dist, href), 'utf8');
      faces.push(...(css.match(FONT_FACE) || []));
    }
    const processed = await beasties.process(html);
    if (!processed.includes('<style>')) throw new Error(`${file}: no critical CSS was inlined`);
    await fs.writeFile(path.join(dist, file), processed.replace('<style>', `<style>${faces.join('')}`));
  }
  console.log(`✅ Inlined critical CSS into ${pages.length} pre-rendered page(s)`);
}

run().catch((err) => {
  console.error('❌ Critical CSS failed:', err);
  process.exit(1);
});
