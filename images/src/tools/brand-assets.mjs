// Makes every brand file from the logo artwork (a 3:2 PNG with a transparent background,
// `my-planet-view-logo.png` at the repo root, 1536×1024):
//   node images/src/tools/brand-assets.mjs [logo.png]      (from the repo root)
//
// It writes:
// - client/src/assets/images/brand/logo-{240,480}.{avif,webp}: the whole logo, the site's
//   wordmark (BrandWordmark: the navbar, the nav column, the footer);
// - client/src/assets/images/brand/emblem-256.{avif,webp}: the compass star over the top
//   of the globe, the passport cover's round crest (PassportCover);
// - client/public/brand/logo.png: the whole logo, 480×320, for the emails and the
//   structured data's `logo` (LogoUrl, constants.js);
// - client/public/brand/og-default.jpg: the 1200×630 share image;
// - client/public/favicon/: favicon.ico (16–64), favicon-96x96.png and favicon.svg are the
//   emblem's star, the one part still legible at 16–32 px; apple-touch-icon.png (180) and
//   the manifest's 192, 512 and maskable 512 are the whole logo on parchment (the maskable
//   one inside the safe circle, 80% of the width).
//
// The emblem's square is measured on this artwork: a new logo needs EMBLEM moved.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SRC = path.resolve(process.argv[2] || path.join(ROOT, 'my-planet-view-logo.png'));
const BRAND_SRC = path.join(ROOT, 'client/src/assets/images/brand');
const BRAND_PUBLIC = path.join(ROOT, 'client/public/brand');
const FAVICON = path.join(ROOT, 'client/public/favicon');

// The site's colours (client/src/styles/index.css): --poster-paper, --poster-red,
// --poster-brown
const PARCHMENT = '#dcbc90';
const POSTER_RED = '#ef4444';
const POSTER_BROWN = '#97572b';
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

// The compass star with the gold ring and the top of the globe under it (source pixels)
const EMBLEM = { left: 620, top: 0, width: 290, height: 290 };

// As images/src/tools/gen-images.mjs encodes them (AVIF 4:2:0: smaller than the WebP)
const AVIF = { quality: 55, effort: 5, chromaSubsampling: '4:2:0' };
const WEBP = { quality: 70 };

const written = [];
async function save(file, buffer) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
  written.push(`${path.relative(ROOT, file).replaceAll('\\', '/')} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

const logoAt = (width) => sharp(SRC).resize({ width }).png().toBuffer();
const emblemAt = (size) => sharp(SRC).extract(EMBLEM).resize(size, size).png().toBuffer();

// `content` centred on a square of parchment
async function onParchment(size, content) {
  return sharp({ create: { width: size, height: size, channels: 4, background: PARCHMENT } })
    .composite([{ input: content, gravity: 'center' }])
    .flatten({ background: PARCHMENT })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// An .ico holding PNG images (every browser since IE Vista reads them)
function icoFrom(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, at);
    header.writeUInt8(size >= 256 ? 0 : size, at + 1);
    header.writeUInt8(0, at + 2);
    header.writeUInt8(0, at + 3);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

async function main() {
  const meta = await sharp(SRC).metadata();
  if (!meta.hasAlpha) throw new Error(`${SRC} has no transparency: the logo needs a transparent background`);

  // The wordmark, two widths, AVIF and WebP
  for (const width of [240, 480]) {
    const png = await logoAt(width);
    await save(path.join(BRAND_SRC, `logo-${width}.avif`), await sharp(png).avif(AVIF).toBuffer());
    await save(path.join(BRAND_SRC, `logo-${width}.webp`), await sharp(png).webp(WEBP).toBuffer());
  }
  // The passport crest
  const emblem256 = await emblemAt(256);
  await save(path.join(BRAND_SRC, 'emblem-256.avif'), await sharp(emblem256).avif(AVIF).toBuffer());
  await save(path.join(BRAND_SRC, 'emblem-256.webp'), await sharp(emblem256).webp(WEBP).toBuffer());

  // The emails' and structured data's logo
  await save(path.join(BRAND_PUBLIC, 'logo.png'), await sharp(await logoAt(480)).png({ compressionLevel: 9, palette: true, quality: 95, dither: 0.6 }).toBuffer());

  // The share image: the logo on parchment in the poster-red frame, a brown rule inside it
  const W = 1200;
  const H = 630;
  const frame = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      `<defs><radialGradient id="g" cx="50%" cy="50%" r="65%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="${W}" height="${H}" fill="${POSTER_RED}"/>` +
      `<rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="${PARCHMENT}"/>` +
      `<rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="url(#g)"/>` +
      `<rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="${POSTER_BROWN}" stroke-width="3" stroke-dasharray="14 8"/>` +
      `</svg>`,
  );
  const ogLogo = await sharp(SRC).resize({ height: 520 }).png().toBuffer();
  await save(
    path.join(BRAND_PUBLIC, 'og-default.jpg'),
    await sharp(frame).composite([{ input: ogLogo, gravity: 'center' }]).jpeg({ quality: 85, mozjpeg: true }).toBuffer(),
  );

  // Favicons: the star
  const icoPngs = [];
  for (const size of [16, 24, 32, 48, 64]) icoPngs.push({ size, data: await sharp(await emblemAt(size)).png({ compressionLevel: 9 }).toBuffer() });
  await save(path.join(FAVICON, 'favicon.ico'), icoFrom(icoPngs));
  await save(path.join(FAVICON, 'favicon-96x96.png'), await sharp(await emblemAt(96)).png({ compressionLevel: 9 }).toBuffer());
  const svgPng = (await sharp(await emblemAt(192)).png({ compressionLevel: 9 }).toBuffer()).toString('base64');
  await save(
    path.join(FAVICON, 'favicon.svg'),
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><image width="192" height="192" href="data:image/png;base64,${svgPng}"/></svg>\n`,
    ),
  );

  // App icons: the whole logo on parchment (iOS fills transparency with black)
  const iconWith = async (size, logoWidth) => onParchment(size, await logoAt(logoWidth));
  await save(path.join(FAVICON, 'apple-touch-icon.png'), await iconWith(180, 168));
  await save(path.join(FAVICON, 'web-app-manifest-192x192.png'), await iconWith(192, 180));
  await save(path.join(FAVICON, 'web-app-manifest-512x512.png'), await iconWith(512, 480));
  // Maskable: everything inside the safe circle (radius 40% of the width). A 3:2 box of
  // width w reaches 0.601w from its centre, so w ≤ 0.4 × 512 / 0.601 = 340
  await save(path.join(FAVICON, 'web-app-manifest-maskable-512x512.png'), await iconWith(512, 340));

  console.log(`From ${path.relative(ROOT, SRC) || SRC}:`);
  for (const line of written) console.log(`  ${line}`);
}

main().catch((err) => {
  console.error('Making the brand files failed:', err.message);
  process.exitCode = 1;
});
