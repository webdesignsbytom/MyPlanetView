// What the seed needs to know about an MP4 or MOV file before saving it as a video
// (prisma/seed/videos.js; docs/API.md "Videos"): its length, its picture size, and whether
// it still holds a location. Reads the boxes ("atoms") of the ISO base media file format;
// never changes the file. Pure.

const LOCATION_MARKERS = [
  // The classic user-data location atom: "©xyz" holding "+51.5074-000.1278/"
  Buffer.from([0xa9, 0x78, 0x79, 0x7a]),
  // QuickTime's metadata key for the same thing (iPhones write this)
  Buffer.from('com.apple.quicktime.location.ISO6709', 'latin1'),
];

/** The boxes in `buffer` from `start` to `end`: `[{ type, start, end, body }]` (body = after the header). */
export function readBoxes(buffer, start = 0, end = buffer.length) {
  const boxes = [];
  let at = start;
  while (at + 8 <= end) {
    let size = buffer.readUInt32BE(at);
    const type = buffer.toString('latin1', at + 4, at + 8);
    let header = 8;
    if (size === 1) {
      if (at + 16 > end) break;
      size = Number(buffer.readBigUInt64BE(at + 8));
      header = 16;
    } else if (size === 0) {
      size = end - at;
    }
    if (size < header || at + size > end) break;
    boxes.push({ type, start: at, end: at + size, body: at + header });
    at += size;
  }
  return boxes;
}

const find = (boxes, type) => boxes.find((box) => box.type === type) ?? null;

/** mvhd: the whole file's length. */
function durationSeconds(buffer, mvhd) {
  const version = buffer.readUInt8(mvhd.body);
  if (version === 1) {
    const timescale = buffer.readUInt32BE(mvhd.body + 20);
    const duration = Number(buffer.readBigUInt64BE(mvhd.body + 24));
    return timescale ? duration / timescale : null;
  }
  const timescale = buffer.readUInt32BE(mvhd.body + 12);
  const duration = buffer.readUInt32BE(mvhd.body + 16);
  return timescale ? duration / timescale : null;
}

/** The first track with a picture: tkhd's width and height (16.16 fixed point, its last 8 bytes). */
function pictureSize(buffer, moov) {
  for (const trak of readBoxes(buffer, moov.body, moov.end).filter((b) => b.type === 'trak')) {
    const tkhd = find(readBoxes(buffer, trak.body, trak.end), 'tkhd');
    if (!tkhd) continue;
    const width = Math.round(buffer.readUInt32BE(tkhd.end - 8) / 65536);
    const height = Math.round(buffer.readUInt32BE(tkhd.end - 4) / 65536);
    if (width > 0 && height > 0) return { width, height };
  }
  return null;
}

/**
 * -> `{ durationS, width, height, hasLocation }` (durationS rounded up to whole seconds),
 * or null when the file has no movie box (not an MP4 or MOV we can read).
 */
export function readMp4Info(buffer) {
  const moov = find(readBoxes(buffer), 'moov');
  if (!moov) return null;
  const mvhd = find(readBoxes(buffer, moov.body, moov.end), 'mvhd');
  const seconds = mvhd ? durationSeconds(buffer, mvhd) : null;
  const size = pictureSize(buffer, moov);
  const movie = buffer.subarray(moov.start, moov.end);
  return {
    durationS: seconds === null ? null : Math.max(1, Math.ceil(seconds)),
    width: size?.width ?? null,
    height: size?.height ?? null,
    hasLocation: LOCATION_MARKERS.some((marker) => movie.includes(marker)),
  };
}
