// @vitest-environment node
import { crc32 as zlibCrc32, deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { crc32, physChunk, pngInfo, pngWithDpi } from '@/utils/poster/pngDpi';

const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const ascii = (text) => Array.from(text, (c) => c.charCodeAt(0));
const chunk = (type, data) => {
  const body = [...ascii(type), ...data];
  return [...u32(data.length), ...body, ...u32(zlibCrc32(Uint8Array.from(body)))];
};
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** A real 2 × 1 RGBA PNG, with a pHYs of its own when asked. */
function minimalPng({ phys = null } = {}) {
  const ihdr = chunk('IHDR', [...u32(2), ...u32(1), 8, 6, 0, 0, 0]);
  const pixels = deflateSync(Uint8Array.from([0, 255, 0, 0, 255, 0, 0, 255, 255]));
  const parts = [SIGNATURE, ihdr];
  if (phys) parts.push(chunk('pHYs', [...u32(phys), ...u32(phys), 1]));
  parts.push(chunk('IDAT', [...pixels]), chunk('IEND', []));
  return Uint8Array.from(parts.flat());
}

/** Every chunk after the signature: its type, data, and whether its CRC is right. */
function chunksOf(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
  const found = [];
  for (let at = 8; at + 12 <= bytes.length; ) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const data = bytes.subarray(at + 8, at + 8 + length);
    const crcOk = view.getUint32(at + 8 + length) === zlibCrc32(bytes.subarray(at + 4, at + 8 + length));
    found.push({ type, data, crcOk });
    at += 12 + length;
  }
  return found;
}

describe('crc32', () => {
  it('is PNG’s CRC-32', () => {
    expect(crc32(Uint8Array.from(ascii('IEND')))).toBe(0xae426082);
    const sample = Uint8Array.from(ascii('The quick brown fox jumps over the lazy dog'));
    expect(crc32(sample)).toBe(zlibCrc32(sample));
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
});

describe('physChunk', () => {
  it('says how many pixels make a metre, in metres, with the right CRC', () => {
    const bytes = physChunk(300);
    const view = new DataView(bytes.buffer);
    expect(bytes).toHaveLength(21);
    expect(view.getUint32(0)).toBe(9);
    expect(String.fromCharCode(...bytes.subarray(4, 8))).toBe('pHYs');
    expect(view.getUint32(8)).toBe(11811);
    expect(view.getUint32(12)).toBe(11811);
    expect(bytes[16]).toBe(1);
    expect(view.getUint32(17)).toBe(zlibCrc32(bytes.subarray(4, 17)));
  });
});

describe('pngWithDpi', () => {
  it('puts a pHYs chunk straight after the header, every chunk’s CRC right', () => {
    const out = pngWithDpi(minimalPng(), 300);
    expect([...out.subarray(0, 8)]).toEqual(SIGNATURE);
    const chunks = chunksOf(out);
    expect(chunks.map((c) => c.type)).toEqual(['IHDR', 'pHYs', 'IDAT', 'IEND']);
    expect(chunks.every((c) => c.crcOk)).toBe(true);
    expect(pngInfo(out)).toEqual({ width: 2, height: 1, dpi: 300 });
  });

  it('replaces a pHYs the PNG had, keeping the picture the same', () => {
    const before = minimalPng({ phys: 2835 });
    expect(pngInfo(before).dpi).toBe(72);
    const out = pngWithDpi(before, 150);
    const chunks = chunksOf(out);
    expect(chunks.filter((c) => c.type === 'pHYs')).toHaveLength(1);
    expect(pngInfo(out).dpi).toBe(150);
    expect(chunks.find((c) => c.type === 'IDAT').data).toEqual(chunksOf(before).find((c) => c.type === 'IDAT').data);
    expect(out.length).toBe(before.length);
  });

  it('reads a slice of a bigger buffer', () => {
    const png = minimalPng();
    const padded = new Uint8Array(png.length + 10);
    padded.set(png, 5);
    expect(pngInfo(pngWithDpi(padded.subarray(5, 5 + png.length), 200))).toEqual({ width: 2, height: 1, dpi: 200 });
  });
});

describe('pngInfo', () => {
  it('gives no dpi for a PNG without pHYs, or with one in no unit', () => {
    expect(pngInfo(minimalPng())).toEqual({ width: 2, height: 1, dpi: null });
    const png = minimalPng({ phys: 2835 });
    // The unit byte: 0 means "aspect ratio only"
    png[8 + 25 + 8 + 8] = 0;
    expect(pngInfo(png).dpi).toBeNull();
  });
});
