// MP4 and MOV files in the browser, without loading them whole (docs/API.md, "Videos"):
// their length and picture size (readVideoInfo), and a copy with the location taken out
// (stripVideoLocation). Both read the file's boxes ("atoms", the ISO base media file
// format, as the server's utils/mp4Info.js does): the top level through small Blob
// slices, then only the movie box (moov, where the metadata lives), at most 64 MB. The
// picture and sound (mdat) are never read: the cleaned copy reuses them as slices of the
// original, so a 500 MB video costs a few hundred kilobytes of memory.
//
// The location check after cleaning uses the server's own markers (mp4Info.js
// LOCATION_MARKERS): a file still holding either, or one that can't be read well enough
// to check, is refused, never uploaded.
//
// Pure (no DOM): the e2e suite runs it in Node too (tests/e2e-app/videos.spec.js).

export const VIDEO_CHECK_FAILED = 'This video couldn’t be checked for its location, so it wasn’t uploaded.';

// The largest movie box read into memory (a 3-minute phone video's is well under 1 MB)
const MOVIE_MAX_BYTES = 64 * 1024 * 1024;
// A fragmented file has a pair of boxes per fragment; this is far beyond any real one
const MAX_TOP_LEVEL_BOXES = 100_000;
// Seconds from 1904-01-01 (QuickTime's epoch) to 1970-01-01
const QUICKTIME_EPOCH_OFFSET = 2_082_844_800;

const asciiBytes = (text) => Uint8Array.from(text, (char) => char.charCodeAt(0));
const XYZ = Uint8Array.of(0xa9, 0x78, 0x79, 0x7a);
// The server's markers: the user-data location atom "©xyz", and QuickTime's location key
const LOCATION_MARKERS = [XYZ, asciiBytes('com.apple.quicktime.location.ISO6709')];
const FREE = asciiBytes('free');

/** A video that can't be read well enough to check for a location. */
export class UncheckableVideoError extends Error {
  constructor() {
    super(VIDEO_CHECK_FAILED);
    this.name = 'UncheckableVideoError';
  }
}
const refuse = () => {
  throw new UncheckableVideoError();
};

const fourcc = (bytes, at) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);
const latin1 = (bytes) => Array.from(bytes, (b) => String.fromCharCode(b)).join('');
const viewOf = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

/** Where `needle` first appears in `bytes`, or -1. */
function indexOf(bytes, needle) {
  let at = bytes.indexOf(needle[0]);
  while (at !== -1 && at + needle.length <= bytes.length) {
    let i = 1;
    while (i < needle.length && bytes[at + i] === needle[i]) i++;
    if (i === needle.length) return at;
    at = bytes.indexOf(needle[0], at + 1);
  }
  return -1;
}

/** Does this metadata still hold a location, by the server's markers? */
export const hasLocationMarker = (bytes) => LOCATION_MARKERS.some((marker) => indexOf(bytes, marker) !== -1);

const readBytes = async (blob, start, end) => new Uint8Array(await blob.slice(start, end).arrayBuffer());

// ── The top level, read in slices ────────────────────────────────────────────

/** The file's top-level boxes, `[{ type, start, end, header }]`; refuses a broken one. */
async function topLevelBoxes(blob) {
  const boxes = [];
  let at = 0;
  while (at < blob.size) {
    const left = blob.size - at;
    const head = await readBytes(blob, at, at + Math.min(16, left));
    if (left < 8) {
      // A few stray bytes at the very end: zeros only
      if (head.some((b) => b !== 0)) refuse();
      break;
    }
    const view = viewOf(head);
    let size = view.getUint32(0);
    let header = 8;
    if (size === 1) {
      // A 64-bit size (a big mdat)
      if (left < 16) refuse();
      size = Number(view.getBigUint64(8));
      header = 16;
    } else if (size === 0) {
      // "To the end of the file"
      size = left;
    }
    if (size < header || size > left) refuse();
    boxes.push({ type: fourcc(head, 4), start: at, end: at + size, header });
    at += size;
    if (boxes.length > MAX_TOP_LEVEL_BOXES) refuse();
  }
  return boxes;
}

/** The one movie box, read into memory: `{ top, moov, bytes }`. */
async function readMovie(blob) {
  const top = await topLevelBoxes(blob);
  const movies = top.filter((box) => box.type === 'moov');
  if (movies.length !== 1) refuse();
  const [moov] = movies;
  if (moov.end - moov.start > MOVIE_MAX_BYTES) refuse();
  return { top, moov, bytes: await readBytes(blob, moov.start, moov.end) };
}

// ── Inside the movie box ─────────────────────────────────────────────────────

/** The boxes in bytes[start, end), `[{ type, start, end, body }]`; refuses a broken one. */
function childBoxes(bytes, start, end) {
  const view = viewOf(bytes);
  const boxes = [];
  let at = start;
  while (end - at >= 8) {
    let size = view.getUint32(at);
    let header = 8;
    if (size === 1) {
      if (end - at < 16) refuse();
      size = Number(view.getBigUint64(at + 8));
      header = 16;
    } else if (size === 0) {
      size = end - at;
    }
    if (size < header || size > end - at) refuse();
    boxes.push({ type: fourcc(bytes, at + 4), start: at, end: at + size, body: at + header });
    at += size;
  }
  // QuickTime may end a list of user data with a 32-bit zero
  for (let i = at; i < end; i++) if (bytes[i] !== 0) refuse();
  return boxes;
}

// Boxes whose contents are boxes, on the way to the metadata
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'edts', 'udta']);
// "©xyz" (QuickTime's and Android's) and "loci" (3GPP's) hold a place
const isLocationBox = (type) => type === '©xyz' || type === 'loci';

/** The box becomes a `free` box of the same size, its contents zeroed. */
function blank(bytes, box) {
  bytes.set(FREE, box.start + 4);
  bytes.fill(0, box.body, box.end);
}

function cleanList(bytes, start, end) {
  for (const box of childBoxes(bytes, start, end)) {
    if (isLocationBox(box.type)) blank(bytes, box);
    else if (box.type === 'meta') cleanMeta(bytes, box);
    else if (CONTAINERS.has(box.type)) cleanList(bytes, box.body, box.end);
  }
}

// A meta box is QuickTime's (in moov or trak: hdlr, keys and ilst straight after its
// header) or ISO's (in udta: a version and flags first). Either starts with its handler.
function metaChildren(bytes, box) {
  const handlerAt = (at) => box.end - at >= 8 && fourcc(bytes, at + 4) === 'hdlr';
  if (handlerAt(box.body)) return childBoxes(bytes, box.body, box.end);
  if (handlerAt(box.body + 4)) return childBoxes(bytes, box.body + 4, box.end);
  try {
    return childBoxes(bytes, box.body + 4, box.end);
  } catch {
    return childBoxes(bytes, box.body, box.end);
  }
}

function cleanMeta(bytes, box) {
  const children = metaChildren(bytes, box);
  const keys = children.find((child) => child.type === 'keys');
  const locationKeys = keys ? renameLocationKeys(bytes, keys) : new Set();
  for (const child of children) {
    if (isLocationBox(child.type)) blank(bytes, child);
    else if (child.type === 'ilst') cleanItems(bytes, child, locationKeys);
  }
}

// A location key: QuickTime's com.apple.quicktime.location.* (ISO6709, accuracy, name…)
// or anyone's key with "location" in it, or a user-data key named ©xyz
const isLocationKey = (name) => latin1(name).toLowerCase().includes('location') || indexOf(name, XYZ) !== -1;
// Same length, so nothing in the file moves: "removed.3.xxxx…"
const harmlessName = (length, index) => asciiBytes(`removed.${index}.`.padEnd(length, 'x').slice(0, length));

/**
 * QuickTime's keys box (version and flags, a count, then each key: its size, namespace and
 * name): every location key gets a harmless name. -> the location keys' numbers (1-based)
 */
function renameLocationKeys(bytes, keys) {
  const view = viewOf(bytes);
  if (keys.end - keys.body < 8) refuse();
  const count = view.getUint32(keys.body + 4);
  const found = new Set();
  let at = keys.body + 8;
  for (let index = 1; index <= count; index++) {
    if (keys.end - at < 8) refuse();
    const size = view.getUint32(at);
    if (size < 8 || size > keys.end - at) refuse();
    const name = bytes.subarray(at + 8, at + size);
    if (isLocationKey(name)) {
      name.set(harmlessName(name.length, index));
      found.add(index);
    }
    at += size;
  }
  return found;
}

/**
 * ilst's items: QuickTime's are named by their key's number, iTunes-style ones by four
 * letters. A location key's item keeps its shape with its value zeroed (a data box's value
 * follows its 4-byte type and 4-byte locale); a ©xyz item goes.
 */
function cleanItems(bytes, ilst, locationKeys) {
  const view = viewOf(bytes);
  for (const item of childBoxes(bytes, ilst.body, ilst.end)) {
    if (isLocationBox(item.type)) blank(bytes, item);
    else if (locationKeys.has(view.getUint32(item.start + 4))) {
      for (const part of childBoxes(bytes, item.body, item.end)) {
        if (part.type === 'data') bytes.fill(0, Math.min(part.body + 8, part.end), part.end);
        else blank(bytes, part);
      }
    }
  }
}

// Unusual places for metadata at the top level, checked with the same markers
const TOP_LEVEL_METADATA = new Set(['udta', 'meta']);

/**
 * A copy of the video with its location taken out, exactly the same size, so nothing in
 * the file moves: every ©xyz and loci box becomes a `free` box with its contents zeroed,
 * and QuickTime's location keys get harmless names and their values zeroed. Only the
 * movie box is read and changed; the rest of the copy is slices of the original. Refuses
 * (UncheckableVideoError) a file it can't read well enough, or one whose metadata still
 * holds a location by the server's markers afterwards. `type` is the copy's MIME type.
 */
export async function stripVideoLocation(file, { type = file.type } = {}) {
  const { top, moov, bytes } = await readMovie(file);
  cleanList(bytes, moov.header, bytes.length);
  if (hasLocationMarker(bytes)) refuse();
  for (const box of top) {
    if (!TOP_LEVEL_METADATA.has(box.type)) continue;
    if (box.end - box.start > MOVIE_MAX_BYTES || hasLocationMarker(await readBytes(file, box.start, box.end))) refuse();
  }
  const cleaned = new Blob([file.slice(0, moov.start), bytes, file.slice(moov.end)], { type });
  if (cleaned.size !== file.size) refuse();
  return cleaned;
}

// ── Length, picture size and date ────────────────────────────────────────────

/** mvhd: the whole movie's length in seconds, or null. */
function movieSeconds(bytes, mvhd) {
  const view = viewOf(bytes);
  const version = bytes[mvhd.body];
  const need = version === 1 ? 32 : 20;
  if (mvhd.end - mvhd.body < need) return null;
  const timescale = view.getUint32(mvhd.body + (version === 1 ? 20 : 12));
  const duration = version === 1 ? Number(view.getBigUint64(mvhd.body + 24)) : view.getUint32(mvhd.body + 16);
  return timescale && duration ? duration / timescale : null;
}

/** mvhd: when it was recorded (UTC), as an ISO string, or null when unset or unlikely. */
function recordedAt(bytes, mvhd, now = Date.now()) {
  const view = viewOf(bytes);
  const version = bytes[mvhd.body];
  if (mvhd.end - mvhd.body < (version === 1 ? 12 : 8)) return null;
  const seconds = version === 1 ? Number(view.getBigUint64(mvhd.body + 4)) : view.getUint32(mvhd.body + 4);
  const ms = (seconds - QUICKTIME_EPOCH_OFFSET) * 1000;
  return ms >= Date.UTC(1990, 0, 1) && ms <= now + 86_400_000 ? new Date(ms).toISOString() : null;
}

/**
 * The first track with a picture: tkhd's width and height (16.16 fixed point, its last 8
 * bytes), turned when its matrix turns the picture a quarter (a phone held upright).
 */
function pictureSize(bytes, movieChildren) {
  const view = viewOf(bytes);
  const fixed = (at) => view.getInt32(at) / 65536;
  for (const trak of movieChildren.filter((box) => box.type === 'trak')) {
    const tkhd = childBoxes(bytes, trak.body, trak.end).find((box) => box.type === 'tkhd');
    if (!tkhd || tkhd.end - tkhd.body < 84) continue;
    const width = Math.round(view.getUint32(tkhd.end - 8) / 65536);
    const height = Math.round(view.getUint32(tkhd.end - 4) / 65536);
    if (!(width > 0 && height > 0)) continue;
    // The matrix (a, b, u, c, d, v, x, y, w) sits just before the width
    const m = tkhd.end - 44;
    const quarterTurn = Math.abs(fixed(m)) < 0.5 && Math.abs(fixed(m + 16)) < 0.5 && Math.abs(fixed(m + 4)) > 0.5 && Math.abs(fixed(m + 12)) > 0.5;
    return quarterTurn ? { width: height, height: width } : { width, height };
  }
  return null;
}

/**
 * What the boxes say about a video: `{ seconds, durationS, width, height, recordedAt }`
 * (durationS rounded up to whole seconds, as the server's mp4Info.js; any of them null
 * when the file doesn't say). Refuses (UncheckableVideoError) a file with no readable
 * movie box: not an MP4 or MOV it can read.
 */
export async function readVideoInfo(file) {
  const { moov, bytes } = await readMovie(file);
  const children = childBoxes(bytes, moov.header, bytes.length);
  const mvhd = children.find((box) => box.type === 'mvhd') || null;
  const seconds = mvhd ? movieSeconds(bytes, mvhd) : null;
  const size = pictureSize(bytes, children);
  return {
    seconds,
    durationS: seconds === null ? null : Math.max(1, Math.ceil(seconds)),
    width: size?.width ?? null,
    height: size?.height ?? null,
    recordedAt: mvhd ? recordedAt(bytes, mvhd) : null,
  };
}

// ── Which files are videos ───────────────────────────────────────────────────

// What the server takes (mediaConstants.js VIDEO_CONTENT_TYPES), by type or by name
// (Windows sometimes gives a file no type)
const TYPE_BY_EXTENSION = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', qt: 'video/quicktime' };
const extension = (name) => (String(name || '').match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();

/** The type a video is uploaded as: 'video/mp4', 'video/quicktime', or null (not MP4 or MOV). */
export function videoContentType(file) {
  const type = String(file.type || '').toLowerCase();
  if (type === 'video/mp4' || type === 'video/quicktime') return type;
  if (type === 'video/x-m4v') return 'video/mp4';
  if (type && type !== 'application/octet-stream') return null;
  return TYPE_BY_EXTENSION[extension(file.name)] || null;
}

/** Is this file a video of any kind (so it's refused as a video, not as a photo)? */
export const isVideoFile = (file) =>
  /^video\//i.test(file.type || '') || ['mp4', 'm4v', 'mov', 'qt', 'webm', 'mkv', 'avi', '3gp', 'wmv'].includes(extension(file.name));
