// Uploads the repo's media/ folder (the country posters, the landmark photos and the
// country guides' festival photos) to the public bucket, keeping its paths:
// media/visitCountryPosters/ru-800.avif becomes
// visitCountryPosters/ru-800.avif, where the client's posterUrl() and landmarkPhotoInfo
// look for it. Only files the bucket lacks, or holds at another size, are sent, so a
// re-run after adding posters or landmark photos sends just those. The user runs it (it
// reads the public bucket's STORAGE_* keys from the env file, through s3public.js):
//   npm run media:upload                          send what's missing
//   npm run media:upload -- --dry-run             say what would be sent, send nothing
//   npm run media:upload -- --only landmarkPhotos one folder
//   npm run media:upload -- --force               send every file again
//   npm run media:upload -- --prune               also delete what the bucket has in these
//                                                 folders that media/ no longer does (a
//                                                 replaced poster, a re-picked photo);
//                                                 with --dry-run it only lists them
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MEDIA_DIR = fileURLToPath(new URL('../../media/', import.meta.url));

// Each folder and how long browsers may keep its files. A replaced poster gets a new
// name, so posters never change at a URL; a landmark photo redone with the tool's
// `--only` keeps its name, so those are kept a week.
export const FOLDERS = {
  visitCountryPosters: 'public, max-age=31536000, immutable',
  landmarkPhotos: 'public, max-age=604800',
  // images/src/tools/festival-photos.mjs: a re-picked photo of the same width keeps its name
  festivalPhotos: 'public, max-age=604800',
};

const CONTENT_TYPES = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

export const contentTypeFor = (name) => CONTENT_TYPES[path.extname(name).toLowerCase()] || null;

// The files to send from one folder: images only (anything else, such as a stray
// Thumbs.db, is skipped), as { key, file, bytes, contentType, cacheControl }
export async function localFiles(folder, mediaDir = MEDIA_DIR) {
  const dir = path.join(mediaDir, folder);
  const names = (await fs.readdir(dir, { withFileTypes: true })).filter((d) => d.isFile()).map((d) => d.name);
  const files = [];
  for (const name of names.sort()) {
    const contentType = contentTypeFor(name);
    if (!contentType) continue;
    const file = path.join(dir, name);
    const { size } = await fs.stat(file);
    files.push({ key: `${folder}/${name}`, file, bytes: size, contentType, cacheControl: FOLDERS[folder] });
  }
  return files;
}

// What to send: every file whose key the bucket lacks or holds at another size
// (`remote` maps key → size), or all of them with `force`
export const filesToSend = (files, remote, { force = false } = {}) =>
  force ? files : files.filter((f) => remote.get(f.key) !== f.bytes);

// What to delete with --prune: every key the bucket has under a folder that media/ lacks
export const keysToPrune = (files, remote) => {
  const local = new Set(files.map((f) => f.key));
  return [...remote.keys()].filter((key) => !local.has(key)).sort();
};

export function parseArgs(argv) {
  const opts = { dryRun: false, force: false, prune: false, only: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--prune') opts.prune = true;
    else if (arg === '--only') opts.only = argv[(i += 1)];
    else if (arg.startsWith('--only=')) opts.only = arg.slice('--only='.length);
    else throw new Error(`Unknown option ${arg}`);
  }
  if (opts.only !== null && !FOLDERS[opts.only]) {
    throw new Error(`--only takes one of: ${Object.keys(FOLDERS).join(', ')}`);
  }
  return opts;
}

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  // Loaded here, so the helpers above can be tested without an env file or the SDK
  const { DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { default: s3, PUBLIC_BUCKET } = await import('../src/services/s3/s3public.js');
  if (!PUBLIC_BUCKET) throw new Error('STORAGE_BUCKET (the public bucket) is not set');

  // Every key already in the bucket under a folder, with its size
  async function remoteSizes(folder) {
    const sizes = new Map();
    let ContinuationToken;
    do {
      const page = await s3.send(
        new ListObjectsV2Command({ Bucket: PUBLIC_BUCKET, Prefix: `${folder}/`, ContinuationToken }),
      );
      for (const obj of page.Contents || []) sizes.set(obj.Key, obj.Size);
      ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);
    return sizes;
  }

  const folders = opts.only ? [opts.only] : Object.keys(FOLDERS);
  const queue = [];
  const stale = [];
  for (const folder of folders) {
    const files = await localFiles(folder);
    const remote = await remoteSizes(folder);
    const send = filesToSend(files, remote, opts);
    const bytes = send.reduce((sum, f) => sum + f.bytes, 0);
    const prune = opts.prune ? keysToPrune(files, remote) : [];
    console.log(
      `${folder}: ${files.length} files here, ${send.length} to send (${megabytes(bytes)})${opts.prune ? `, ${prune.length} to delete` : ''}`,
    );
    queue.push(...send);
    stale.push(...prune);
  }

  // --prune: the bucket's files that media/ no longer has, one DeleteObjects per 1,000
  if (stale.length && opts.dryRun) {
    for (const key of stale.slice(0, 20)) console.log(`  would delete ${key}`);
    if (stale.length > 20) console.log(`  …and ${stale.length - 20} more`);
  } else if (stale.length) {
    let deleted = 0;
    for (let i = 0; i < stale.length; i += 1000) {
      const batch = stale.slice(i, i + 1000);
      const res = await s3.send(
        new DeleteObjectsCommand({ Bucket: PUBLIC_BUCKET, Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true } }),
      );
      const errors = res.Errors || [];
      deleted += batch.length - errors.length;
      for (const e of errors.slice(0, 20)) console.error(`  not deleted: ${e.Key}: ${e.Code}`);
      if (errors.length) process.exitCode = 1;
    }
    console.log(`Deleted ${deleted} of ${stale.length} files media/ no longer has.`);
  }

  if (opts.dryRun || !queue.length) {
    console.log(queue.length ? 'Dry run: nothing sent.' : 'The bucket already has every file.');
    return;
  }

  // Eight at a time; the SDK retries each request itself, and a file that still fails is
  // listed at the end (a re-run sends only what's missing)
  const failed = [];
  let done = 0;
  const next = () => queue.shift();
  async function worker() {
    for (let f = next(); f; f = next()) {
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: PUBLIC_BUCKET,
            Key: f.key,
            Body: await fs.readFile(f.file),
            ContentType: f.contentType,
            ContentLength: f.bytes,
            CacheControl: f.cacheControl,
          }),
        );
      } catch (err) {
        failed.push(`${f.key}: ${err.message}`);
      }
      done += 1;
      if (done % 100 === 0) console.log(`  ${done} sent…`);
    }
  }
  const total = queue.length;
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`Sent ${total - failed.length} of ${total} files.`);
  if (failed.length) {
    console.error(`${failed.length} failed (run it again to retry them):`);
    for (const line of failed.slice(0, 20)) console.error(`  ${line}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Uploading the media failed:', err.message);
    process.exitCode = 1;
  });
}
