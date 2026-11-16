// "Print or download" (docs/API.md, "Downloads"): which photos go in the zip, what each
// is called inside it, and how a big download is cut into parts. Pure apart from
// `listDownloadFiles`, which pages through the photo list with `best=1` (editors only).
import { getPhotoPage } from '@/api/travelApi';
import { countryName } from '@/utils/map/countries';

// The list's biggest page with `best=1` (the server's BEST_PAGE_MAX)
export const DOWNLOAD_PAGE_SIZE = 200;
// Signed links last at least an hour (signed at the start of the hour, valid for two):
// a page listed longer ago than this is listed again before its files are fetched
export const LINK_FRESH_MS = 45 * 60 * 1000;
// Without a save dialog that writes straight to disk (showSaveFilePicker), the browser
// holds each zip in memory until it's saved: big downloads come as parts of at most this
export const PART_MAX_BYTES = 500 * 1000 * 1000;
// A photo whose size isn't known (an old photo, a demo one) counts as this when parting
const UNKNOWN_BYTES_GUESS = 3 * 1000 * 1000;

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
export const extensionFor = (contentType) => EXTENSIONS[contentType] ?? 'jpg';

// Characters no file system takes, and control characters (a caption is cleaned text, but
// a zip entry's name must never carry one)
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const UNSAFE = /[\\/:*?"<>|\u0000-\u001f\u007f]+/g;
const NAME_MAX = 80;

/** A file or folder name that every system and zip tool takes: never empty, never "." or "..". */
export function safeName(text, fallback = 'Photo') {
  const cleaned = String(text ?? '')
    .replace(UNSAFE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .slice(0, NAME_MAX)
    .trim();
  return cleaned || fallback;
}

// The day a photo was taken, as written in its file (no time zone sums): `2025-06-14`
const takenDay = (takenAt) => (typeof takenAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(takenAt) ? takenAt.slice(0, 10) : null);

/**
 * The scope's photos, page by page, with each one's best copy. `scope` is
 * `{ mapId, tripId?, country?, unplaced? }` or `{ tripId }` (a trip-only editor).
 * -> `{ photos, pages }`: `photos` in list order, each `{ id, caption, takenAt,
 * countryCode, kind, best, page }` (`page` indexes `pages`, which keeps each page's
 * cursor and when it was listed, for `relistPage`).
 */
export async function listDownloadFiles(scope, { signal, onProgress } = {}) {
  const photos = [];
  const pages = [];
  let cursor;
  do {
    const listedAt = Date.now();
    const page = await getPhotoPage({ ...scope, cursor, limit: DOWNLOAD_PAGE_SIZE, best: true });
    if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
    pages.push({ cursor, listedAt });
    for (const photo of page.photos ?? []) photos.push({ ...photo, page: pages.length - 1 });
    onProgress?.(photos.length);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return { photos, pages };
}

/** Fresh links for one page of the list (`pages[i].cursor`): `Map(photoId -> best)`. */
export async function relistPage(scope, pageInfo) {
  const page = await getPhotoPage({ ...scope, cursor: pageInfo.cursor, limit: DOWNLOAD_PAGE_SIZE, best: true });
  pageInfo.listedAt = Date.now();
  return new Map((page.photos ?? []).map((p) => [p.id, p.best]));
}

/**
 * The zip's entries: every photo with a best copy, named `<day> <caption>.<ext>` (or
 * `Photo` without either), numbered when two would share a name. `byCountry` (the whole
 * map) puts each in a folder named after its country ("No country" for unplaced ones).
 * Videos and photos with no file are counted, not listed: Stream keeps no original.
 * -> `{ files: [{ id, copy, name, url, bytes, lastModified, page }], videos, missing, totalBytes, unknownSizes }`
 */
export function zipEntries(photos, { byCountry = false } = {}) {
  const used = new Set();
  const files = [];
  let videos = 0;
  let missing = 0;
  let totalBytes = 0;
  let unknownSizes = 0;
  for (const photo of photos) {
    if (photo.kind === 'VIDEO') {
      videos += 1;
      continue;
    }
    const best = photo.best;
    if (!best?.url) {
      missing += 1;
      continue;
    }
    const day = takenDay(photo.takenAt);
    const label = safeName([day, photo.caption].filter(Boolean).join(' '), 'Photo');
    const folder = byCountry ? `${safeName(photo.countryCode ? countryName(photo.countryCode) : 'No country')}/` : '';
    const ext = extensionFor(best.contentType);
    let name = `${folder}${label}.${ext}`;
    for (let n = 2; used.has(name.toLowerCase()); n += 1) name = `${folder}${label} (${n}).${ext}`;
    used.add(name.toLowerCase());
    if (Number.isFinite(best.bytes)) totalBytes += best.bytes;
    else unknownSizes += 1;
    files.push({
      id: photo.id,
      copy: best.copy,
      name,
      url: best.url,
      bytes: Number.isFinite(best.bytes) ? best.bytes : null,
      lastModified: photo.takenAt ? new Date(photo.takenAt) : new Date(),
      page: photo.page,
    });
  }
  return { files, videos, missing, totalBytes, unknownSizes };
}

/**
 * Cut the files into parts of at most `maxBytes` (an unknown size counts as a guess),
 * keeping their order; a single file bigger than that is a part of its own.
 */
export function splitIntoParts(files, maxBytes = PART_MAX_BYTES) {
  const parts = [];
  let current = [];
  let size = 0;
  for (const file of files) {
    const bytes = file.bytes ?? UNKNOWN_BYTES_GUESS;
    if (current.length && size + bytes > maxBytes) {
      parts.push(current);
      current = [];
      size = 0;
    }
    current.push(file);
    size += bytes;
  }
  if (current.length) parts.push(current);
  return parts;
}

/** The zip's name: `<title>.zip`, or `<title> (part 2 of 3).zip`. */
export function zipFileName(title, part = 1, parts = 1) {
  const base = safeName(title, 'My photos');
  return parts > 1 ? `${base} (part ${part} of ${parts}).zip` : `${base}.zip`;
}

/** "1.2 GB", "340 MB", "85 KB": decimal units, as phones and computers show file sizes. */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(bytes >= 1e10 ? 0 : 1)} GB`;
  if (bytes >= 1e6) return `${Math.round(bytes / 1e6)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}
