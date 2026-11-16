import { describe, it, expect } from 'vitest';
import { readBoxes, readMp4Info } from '../src/utils/mp4Info.js';

// A box: 4-byte size, 4-byte type, body
const box = (type, ...parts) => {
  const body = Buffer.concat(parts);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + body.length, 0);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, body]);
};
const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
};
// mvhd version 0: version+flags, created, modified, timescale, duration, then the rest
const mvhd = (timescale, duration) => box('mvhd', u32(0), u32(0), u32(0), u32(timescale), u32(duration), Buffer.alloc(80));
// tkhd: 76 bytes of fields, then width and height in 16.16
const tkhd = (width, height) => box('tkhd', Buffer.alloc(76), u32(width * 65536), u32(height * 65536));
const movie = (...extra) =>
  Buffer.concat([
    box('ftyp', Buffer.from('isom', 'latin1'), u32(0)),
    box('moov', mvhd(600, 600 * 42.5), box('trak', tkhd(1280, 720)), ...extra),
    box('mdat', Buffer.alloc(32)),
  ]);

describe('reading an MP4', () => {
  it('finds its length, rounded up, and its picture size', () => {
    expect(readMp4Info(movie())).toEqual({ durationS: 43, width: 1280, height: 720, hasLocation: false });
  });

  it('spots a location left in the file, either kind', () => {
    const xyz = box('udta', box('\u00a9xyz', Buffer.from('+51.5074-000.1278/', 'latin1')));
    expect(readMp4Info(movie(xyz)).hasLocation).toBe(true);
    const keys = box('meta', box('keys', Buffer.from('mdtacom.apple.quicktime.location.ISO6709', 'latin1')));
    expect(readMp4Info(movie(keys)).hasLocation).toBe(true);
  });

  it('reads a box with a 64-bit size, and gives up on what is not a movie', () => {
    const big = Buffer.alloc(24);
    big.writeUInt32BE(1, 0);
    big.write('free', 4, 'latin1');
    big.writeBigUInt64BE(24n, 8);
    expect(readBoxes(big).map((b) => b.type)).toEqual(['free']);
    expect(readMp4Info(Buffer.from('not a video at all'))).toBeNull();
  });
});
