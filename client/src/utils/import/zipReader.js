// Reading a zip in the browser, a file at a time (the Polarsteps download can be gigabytes):
// only the zip's index (its central directory) is read up front; each entry's bytes are read
// when asked for, as a slice of the File, and unpacked with the browser's own
// DecompressionStream. Stored and deflated entries, ZIP64 (over 4 GB or 65,535 entries);
// never encrypted ones.

const EOCD = 0x06054b50;
const ZIP64_LOCATOR = 0x07064b50;
const ZIP64_EOCD = 0x06064b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

const view = async (blob, start, end) => new DataView(await blob.slice(start, end).arrayBuffer());
const big = (dataView, at) => Number(dataView.getBigUint64(at, true));

const notAZip = () => new Error('That file isn’t a zip, or it’s damaged. Choose the zip Polarsteps sent you.');

/** The zip's files: `[{ path, size, read() -> Promise<Blob> }]` (folders left out). */
export async function readZipEntries(file) {
  const tailLength = Math.min(file.size, 22 + 65535 + 20);
  const tailStart = file.size - tailLength;
  const tail = await view(file, tailStart, file.size);
  let end = -1;
  for (let at = tail.byteLength - 22; at >= 0; at--) {
    if (tail.getUint32(at, true) === EOCD) {
      end = at;
      break;
    }
  }
  if (end < 0) throw notAZip();

  let count = tail.getUint16(end + 10, true);
  let directorySize = tail.getUint32(end + 12, true);
  let directoryStart = tail.getUint32(end + 16, true);
  // ZIP64: the real numbers are in the ZIP64 end record, which the locator before it points at
  if (count === 0xffff || directorySize === 0xffffffff || directoryStart === 0xffffffff) {
    const locator = end - 20;
    if (locator < 0 || tail.getUint32(locator, true) !== ZIP64_LOCATOR) throw notAZip();
    const recordAt = big(tail, locator + 8);
    const record = await view(file, recordAt, recordAt + 56);
    if (record.getUint32(0, true) !== ZIP64_EOCD) throw notAZip();
    count = big(record, 32);
    directorySize = big(record, 40);
    directoryStart = big(record, 48);
  }

  const directory = await view(file, directoryStart, directoryStart + directorySize);
  const utf8 = new TextDecoder();
  const entries = [];
  let at = 0;
  for (let i = 0; i < count && at + 46 <= directory.byteLength; i++) {
    if (directory.getUint32(at, true) !== CENTRAL) throw notAZip();
    const flags = directory.getUint16(at + 8, true);
    const method = directory.getUint16(at + 10, true);
    let packedSize = directory.getUint32(at + 20, true);
    let size = directory.getUint32(at + 24, true);
    const nameLength = directory.getUint16(at + 28, true);
    const extraLength = directory.getUint16(at + 30, true);
    const commentLength = directory.getUint16(at + 32, true);
    let localAt = directory.getUint32(at + 42, true);
    const path = utf8.decode(new Uint8Array(directory.buffer, directory.byteOffset + at + 46, nameLength));
    // The ZIP64 extra field holds whichever of the three didn't fit
    let extra = at + 46 + nameLength;
    const extraEnd = extra + extraLength;
    while (extra + 4 <= extraEnd) {
      const id = directory.getUint16(extra, true);
      const length = directory.getUint16(extra + 2, true);
      if (id === 0x0001) {
        let field = extra + 4;
        if (size === 0xffffffff) {
          size = big(directory, field);
          field += 8;
        }
        if (packedSize === 0xffffffff) {
          packedSize = big(directory, field);
          field += 8;
        }
        if (localAt === 0xffffffff) localAt = big(directory, field);
      }
      extra += 4 + length;
    }
    at = extraEnd + commentLength;
    if (path.endsWith('/')) continue;
    const entry = { method, flags, packedSize, localAt };
    entries.push({ path, size, read: () => readEntry(file, entry) });
  }
  return entries;
}

async function readEntry(file, { method, flags, packedSize, localAt }) {
  if (flags & 1) throw new Error('That zip is password-protected, so it can’t be read.');
  const head = await view(file, localAt, localAt + 30);
  if (head.getUint32(0, true) !== LOCAL) throw notAZip();
  const start = localAt + 30 + head.getUint16(26, true) + head.getUint16(28, true);
  const packed = file.slice(start, start + packedSize);
  if (method === 0) return packed;
  if (method === 8) return new Response(packed.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
  throw new Error('Part of that zip is packed in a way the browser can’t read. Unzip it and choose the folder instead.');
}
