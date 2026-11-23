// @vitest-environment node
// Node has File, Blob streams, CompressionStream and DecompressionStream, as browsers do
import { describe, expect, it } from 'vitest';
import { readZipEntries } from '@/utils/import/zipReader';
import { exportFiles } from '@/utils/import/exportFiles';

const encoder = new TextEncoder();
const bytes = (text) => encoder.encode(text);

async function deflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * A zip of `entries` (`{ name, data, method, flags }`, method 0 stored or 8 deflated), the CRCs
 * left at 0 (the reader never checks them). `zip64` writes the sizes and offsets in ZIP64
 * fields and the ZIP64 end records, as a zip over 4 GB has them; `comment` adds an archive comment.
 */
async function makeZip(entries, { zip64 = false, comment = '' } = {}) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const { name, data = new Uint8Array(), method = 0, flags = 0 } of entries) {
    const packed = method === 8 ? await deflate(data) : data;
    const nameBytes = bytes(name);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, flags, true);
    local.setUint16(8, method, true);
    local.setUint32(18, packed.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, packed);

    const extra = zip64 ? new DataView(new ArrayBuffer(28)) : null;
    if (extra) {
      extra.setUint16(0, 0x0001, true);
      extra.setUint16(2, 24, true);
      extra.setBigUint64(4, BigInt(data.length), true);
      extra.setBigUint64(12, BigInt(packed.length), true);
      extra.setBigUint64(20, BigInt(offset), true);
    }
    const head = new DataView(new ArrayBuffer(46));
    head.setUint32(0, 0x02014b50, true);
    head.setUint16(8, flags, true);
    head.setUint16(10, method, true);
    head.setUint32(20, zip64 ? 0xffffffff : packed.length, true);
    head.setUint32(24, zip64 ? 0xffffffff : data.length, true);
    head.setUint16(28, nameBytes.length, true);
    head.setUint16(30, extra ? extra.byteLength : 0, true);
    head.setUint32(42, zip64 ? 0xffffffff : offset, true);
    central.push(new Uint8Array(head.buffer), nameBytes, ...(extra ? [new Uint8Array(extra.buffer)] : []));
    offset += 30 + nameBytes.length + packed.length;
  }
  const directoryStart = offset;
  const directorySize = central.reduce((n, part) => n + part.length, 0);
  const tail = [];
  if (zip64) {
    const record = new DataView(new ArrayBuffer(56));
    record.setUint32(0, 0x06064b50, true);
    record.setBigUint64(4, 44n, true);
    record.setBigUint64(24, BigInt(entries.length), true);
    record.setBigUint64(32, BigInt(entries.length), true);
    record.setBigUint64(40, BigInt(directorySize), true);
    record.setBigUint64(48, BigInt(directoryStart), true);
    const locator = new DataView(new ArrayBuffer(20));
    locator.setUint32(0, 0x07064b50, true);
    locator.setBigUint64(8, BigInt(directoryStart + directorySize), true);
    locator.setUint32(16, 1, true);
    tail.push(new Uint8Array(record.buffer), new Uint8Array(locator.buffer));
  }
  const commentBytes = bytes(comment);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, zip64 ? 0xffff : entries.length, true);
  end.setUint16(10, zip64 ? 0xffff : entries.length, true);
  end.setUint32(12, zip64 ? 0xffffffff : directorySize, true);
  end.setUint32(16, zip64 ? 0xffffffff : directoryStart, true);
  end.setUint16(20, commentBytes.length, true);
  return new File([...parts, ...central, ...tail, new Uint8Array(end.buffer), commentBytes], 'polarsteps.zip', { type: 'application/zip' });
}

const text = async (entry) => (await entry.read()).text();
const tripJson = JSON.stringify({ id: 1, name: 'Japan', all_steps: [] });
const longText = 'Tokyo, Kyoto and Osaka. '.repeat(200);

describe('readZipEntries', () => {
  it('lists the files, folders left out, and reads stored and deflated ones', async () => {
    const zip = await makeZip([
      { name: 'trip/' },
      { name: 'trip/japan_1/trip.json', data: bytes(tripJson), method: 8 },
      { name: 'trip/japan_1/tokyo_11/photos/ç.jpg', data: bytes('JPEG') },
      { name: 'trip/japan_1/notes.txt', data: bytes(longText), method: 8 },
    ]);
    const entries = await readZipEntries(zip);
    expect(entries.map((entry) => [entry.path, entry.size])).toEqual([
      ['trip/japan_1/trip.json', tripJson.length],
      ['trip/japan_1/tokyo_11/photos/ç.jpg', 4],
      ['trip/japan_1/notes.txt', longText.length],
    ]);
    expect(await text(entries[0])).toBe(tripJson);
    expect(await text(entries[1])).toBe('JPEG');
    expect(await text(entries[2])).toBe(longText);
  });

  it('reads a ZIP64 zip, its numbers in the ZIP64 fields', async () => {
    const zip = await makeZip(
      [
        { name: 'a.txt', data: bytes('first') },
        { name: 'b.txt', data: bytes(longText), method: 8 },
      ],
      { zip64: true },
    );
    const entries = await readZipEntries(zip);
    expect(entries.map((entry) => [entry.path, entry.size])).toEqual([
      ['a.txt', 5],
      ['b.txt', longText.length],
    ]);
    expect(await text(entries[0])).toBe('first');
    expect(await text(entries[1])).toBe(longText);
  });

  it('finds the end of the zip behind an archive comment', async () => {
    const zip = await makeZip([{ name: 'a.txt', data: bytes('x') }], { comment: 'Made by Polarsteps' });
    expect((await readZipEntries(zip)).map((entry) => entry.path)).toEqual(['a.txt']);
  });

  it('says so when the file isn’t a zip', async () => {
    const notZip = new File(['just some text, not a zip at all'], 'trip.zip');
    await expect(readZipEntries(notZip)).rejects.toThrow('That file isn’t a zip, or it’s damaged. Choose the zip Polarsteps sent you.');
    await expect(readZipEntries(new File([], 'empty.zip'))).rejects.toThrow('isn’t a zip');
  });

  it('refuses a password-protected entry, and a way of packing the browser can’t read, when it’s read', async () => {
    const zip = await makeZip([
      { name: 'secret.txt', data: bytes('x'), flags: 1 },
      { name: 'bzip.txt', data: bytes('x'), method: 12 },
    ]);
    const [secret, bzip] = await readZipEntries(zip);
    await expect(secret.read()).rejects.toThrow('That zip is password-protected, so it can’t be read.');
    await expect(bzip.read()).rejects.toThrow('Unzip it and choose the folder instead.');
  });
});

describe('exportFiles', () => {
  it('reads a single zip, known by its name or its type', async () => {
    const zip = await makeZip([{ name: 'trip/trip.json', data: bytes(tripJson) }]);
    const files = await exportFiles([zip]);
    expect(files.map((file) => file.path)).toEqual(['trip/trip.json']);
    const byType = new File([await zip.arrayBuffer()], 'download', { type: 'application/x-zip-compressed' });
    expect((await exportFiles([byType])).map((file) => file.path)).toEqual(['trip/trip.json']);
  });

  it('gives a folder’s files by their path in the folder, with forward slashes', async () => {
    const photo = new File(['JPEG'], '1.jpg', { type: 'image/jpeg' });
    Object.defineProperty(photo, 'webkitRelativePath', { value: 'polarsteps\\trip\\japan_1\\1.jpg' });
    const loose = new File(['{}'], 'trip.json');
    const files = await exportFiles([photo, loose]);
    expect(files.map(({ path, size }) => [path, size])).toEqual([
      ['polarsteps/trip/japan_1/1.jpg', 4],
      ['trip.json', 2],
    ]);
    expect(await files[0].read()).toBe(photo);
  });

  it('gives nothing for nothing chosen', async () => {
    expect(await exportFiles(null)).toEqual([]);
  });
});
