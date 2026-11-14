// Inline critical CSS into built HTML
import fs from 'node:fs/promises';
import path from 'node:path';
import Critters from 'critters';

const outDir = path.resolve('dist');

async function findHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findHtmlFiles(full)));
    } else if (entry.name === 'index.html') {
      files.push(full);
    }
  }

  return files;
}

// Critters config
const critters = new Critters({
  path: outDir,
  publicPath: '/',
  preload: 'swap',
  inlineFonts: true,
  pruneSource: false,
  compress: true,
  logLevel: 'warn',
  dimensions: [
    { width: 375, height: 667 }, // small phone
    { width: 768, height: 1024 }, // tablet
    { width: 1280, height: 800 }, // desktop
  ],
});

async function run() {
  const htmlFiles = await findHtmlFiles(outDir);

  for (const filePath of htmlFiles) {
    const html = await fs.readFile(filePath, 'utf8');
    const processed = await critters.process(html);
    await fs.writeFile(filePath, processed);
  }

  console.log(
    `✅ Inlined critical CSS into ${htmlFiles.length} HTML file(s)`
  );
}

run().catch((e) => {
  console.error('❌ Critters failed:', e);
  process.exit(1);
});
