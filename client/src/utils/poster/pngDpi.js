// A PNG's print size (22 Nov 2026, the map poster): a canvas's PNG says nothing about its
// resolution, so print shops and photo apps take it as 72 or 96 dpi and print a 7,000-pixel
// map metres wide. A pHYs chunk after the header says how many pixels make a metre. Pure.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** PNG's CRC-32 of some bytes. */
export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** The pHYs chunk for `dpi`: length, type, pixels per metre across and down, the unit (metres), CRC. */
export function physChunk(dpi) {
  const perMetre = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  view.setUint32(8, perMetre);
  view.setUint32(12, perMetre);
  chunk[16] = 1;
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  return chunk;
}

// The signature (8 bytes) and the header chunk, IHDR, always first and 25 bytes long
const AFTER_HEADER = 33;

/** The PNG's bytes with its resolution set to `dpi` (any pHYs it had is left out). */
export function pngWithDpi(bytes, dpi) {
  const parts = [bytes.subarray(0, AFTER_HEADER), physChunk(dpi)];
  let at = AFTER_HEADER;
  while (at + 8 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + at, 4).getUint32(0);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const end = at + 12 + length;
    if (type !== 'pHYs') parts.push(bytes.subarray(at, end));
    at = end;
  }
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** A PNG's width, height and dpi (null when it has no pHYs in metres), for checking. */
export function pngInfo(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
  const info = { width: view.getUint32(16), height: view.getUint32(20), dpi: null };
  let at = AFTER_HEADER;
  while (at + 8 <= bytes.length) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    if (type === 'pHYs' && bytes[at + 16] === 1) info.dpi = Math.round(view.getUint32(at + 8) * 0.0254);
    if (type === 'IDAT') break;
    at += 12 + length;
  }
  return info;
}
