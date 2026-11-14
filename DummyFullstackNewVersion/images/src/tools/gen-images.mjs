// Usage: node src/tools/gen-images.mjs <inputDir> <outputDir> "480,800,1200"

import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import sharp from 'sharp';
import convert from 'heic-convert';

const [, , inputDirArg, outputDirArg, sizesArg] = process.argv;

if (!inputDirArg || !outputDirArg) {
  console.error(
    'Usage: node src/tools/gen-images.mjs <inputDir> <outputDir> <sizesCSV>',
  );
  process.exit(1);
}

const inputDir = path.resolve(inputDirArg);
const outputDir = path.resolve(outputDirArg);

const sizes = (sizesArg || '480,800,1200')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => Number.isFinite(n) && n > 0)
  .sort((a, b) => a - b);

const formats = [
  {
    ext: 'avif',
    options: { quality: 55, effort: 5 },
  },
  {
    ext: 'webp',
    options: { quality: 70 },
  },
  {
    ext: 'jpg',
    options: { quality: 82, progressive: true, mozjpeg: true },
  },
];

const VALID_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
]);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function getNumberedFolder(index) {
  const num = String(index + 1).padStart(3, '0');
  return path.join(outputDir, num);
}

function isHeicExt(ext) {
  return ext === '.heic' || ext === '.heif';
}

function looksLikeHeic(buffer) {
  if (!buffer || buffer.length < 32) return false;

  const header = buffer.subarray(0, 64).toString('latin1');

  return (
    header.includes('ftypheic') ||
    header.includes('ftypheix') ||
    header.includes('ftyphevc') ||
    header.includes('ftyphevx') ||
    header.includes('ftypmif1') ||
    header.includes('ftypmsf1')
  );
}

async function loadImageBuffer(file) {
  const ext = path.extname(file).toLowerCase();
  const inputBuffer = await fs.readFile(file);

  const shouldConvertHeic = isHeicExt(ext) || looksLikeHeic(inputBuffer);

  if (!shouldConvertHeic) {
    return {
      buffer: inputBuffer,
      wasHeic: false,
    };
  }

  console.log(
    `  [HEIC] Converting source to in-memory JPEG: ${path.basename(file)}`,
  );

  const convertedBuffer = await convert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 1,
  });

  return {
    buffer: Buffer.from(convertedBuffer),
    wasHeic: true,
  };
}

async function processOne(file, outputIndex) {
  const originalExt = path.extname(file).toLowerCase();
  const { buffer: inputBuffer, wasHeic } = await loadImageBuffer(file);

  const src = sharp(inputBuffer, { limitInputPixels: false });
  const meta = await src.metadata();

  if (!meta.width) {
    throw new Error(`Could not determine width for file: ${file}`);
  }

  const targetWidths = sizes.filter((w) => w <= meta.width);
  const finalWidths = targetWidths.length ? targetWidths : [meta.width];

  const baseName = path.basename(file, path.extname(file));
  const numberedFolder = getNumberedFolder(outputIndex);

  await ensureDir(numberedFolder);

  const hasAlpha = Boolean(meta.hasAlpha) && !wasHeic && !isHeicExt(originalExt);

  console.log(
    `  [META] width=${meta.width} height=${meta.height || 'unknown'} alpha=${hasAlpha} widths=${finalWidths.join(', ')}`,
  );

  for (const width of finalWidths) {
    const resized = sharp(inputBuffer, { limitInputPixels: false }).resize({
      width,
      withoutEnlargement: true,
    });

    for (const fmt of formats) {
      const outFile = path.join(numberedFolder, `${baseName}-${width}.${fmt.ext}`);

      if (fmt.ext === 'avif') {
        await resized.clone().avif(fmt.options).toFile(outFile);
        console.log(`    [WRITE] ${path.relative(outputDir, outFile)}`);
        continue;
      }

      if (fmt.ext === 'webp') {
        await resized.clone().webp(fmt.options).toFile(outFile);
        console.log(`    [WRITE] ${path.relative(outputDir, outFile)}`);
        continue;
      }

      if (fmt.ext === 'jpg') {
        if (hasAlpha) {
          await resized
            .clone()
            .flatten({ background: '#ffffff' })
            .jpeg(fmt.options)
            .toFile(outFile);
        } else {
          await resized.clone().jpeg(fmt.options).toFile(outFile);
        }

        console.log(`    [WRITE] ${path.relative(outputDir, outFile)}`);
      }
    }
  }

  await fs.unlink(file);
  console.log(`  [DELETE] ${path.relative(inputDir, file)}`);
}

async function run() {
  const allFiles = await fg([`${inputDir.replace(/\\/g, '/')}/**/*`], {
    dot: false,
    onlyFiles: true,
  });

  const files = allFiles.filter((file) =>
    VALID_EXT.has(path.extname(file).toLowerCase()),
  );

  if (!files.length) {
    console.error(`No supported images found in ${inputDir}.`);
    process.exit(2);
  }

  console.log(`Found ${files.length} source image(s). Generating:`);
  console.log(`  Sizes: ${sizes.join(', ')} px`);
  console.log(`  Formats: ${formats.map((f) => f.ext).join(', ')}`);
  console.log(`  Output base: ${outputDir}`);
  console.log(`  Each image -> its own numbered folder (001, 002, ...)`);
  console.log();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(
      `Processing [${i + 1}/${files.length}]: ${path.relative(inputDir, file)}`,
    );
    await processOne(file, i);
    console.log();
  }

  console.log('✅ Done. All supported originals processed and deleted.');
}

run().catch((err) => {
  console.error('❌ Image generation failed.');
  console.error(err);
  process.exit(1);
});