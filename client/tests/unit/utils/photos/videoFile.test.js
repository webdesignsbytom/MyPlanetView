// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  UncheckableVideoError,
  VIDEO_CHECK_FAILED,
  VIDEO_HAS_GPS_TRACK,
  hasLocationMarker,
  isVideoFile,
  readVideoInfo,
  stripVideoLocation,
  videoContentType,
} from '@/utils/photos/videoFile';

// ── MP4 boxes, built byte by byte ────────────────────────────────────────────
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u64 = (n) => {
  const big = BigInt(n);
  return [...u32(Number(big >> 32n)), ...u32(Number(big & 0xffffffffn))];
};
// Latin-1, so "©xyz" is the byte 0xA9 then "xyz", as in the files
const bytesOf = (text) => Array.from(text, (char) => char.charCodeAt(0));
const zeros = (n) => new Array(n).fill(0);
const box = (type, ...parts) => {
  const body = parts.flat();
  const typeBytes = Array.isArray(type) ? type : bytesOf(type);
  return [...u32(8 + body.length), ...typeBytes, ...body];
};

const QUICKTIME_EPOCH_OFFSET = 2_082_844_800;
const quickTime = (iso) => Date.parse(iso) / 1000 + QUICKTIME_EPOCH_OFFSET;

const mvhd = ({ timescale = 1000, duration = 41_200, created = quickTime('2025-06-14T09:00:00Z') } = {}) =>
  box('mvhd', [0, 0, 0, 0], u32(created), u32(created), u32(timescale), u32(duration), zeros(80));
const mvhd64 = ({ timescale, duration, created }) => box('mvhd', [1, 0, 0, 0], u64(created), u64(created), u32(timescale), u64(duration), zeros(80));

/** A track header with a picture size and a matrix (a quarter turn for a phone held upright). */
const tkhd = (width, height, { quarterTurn = false } = {}) => {
  const body = zeros(84);
  const set = (at, values) => values.forEach((value, i) => (body[at + i] = value));
  const ONE = 0x00010000;
  if (quarterTurn) {
    set(44, u32(ONE)); // b
    set(52, u32(-ONE >>> 0)); // c
  } else {
    set(40, u32(ONE)); // a
    set(56, u32(ONE)); // d
  }
  set(76, u32(width * 65536));
  set(80, u32(height * 65536));
  return box('tkhd', body);
};

/** A track whose first sample description has the format `format`. */
const trakOf = (format, size = [0, 0]) =>
  box('trak', tkhd(...size), box('mdia', box('minf', box('stbl', box('stsd', [0, 0, 0, 0], u32(1), u32(16), bytesOf(format), zeros(8))))));

const ftyp = box('ftyp', bytesOf('isom'), u32(512), bytesOf('isommp41'));
const mdat = box('mdat', bytesOf('picture and sound, never read'));

const fileOf = (...topBoxes) => new Blob([Uint8Array.from(topBoxes.flat())], { type: 'video/mp4' });
const movie = (...children) => box('moov', mvhd(), trakOf('avc1', [1920, 1080]), ...children);
const bytesFrom = async (blob) => new Uint8Array(await blob.arrayBuffer());
const indexOfText = (bytes, text) => Buffer.from(bytes).indexOf(Buffer.from(bytesOf(text)));

// ── readVideoInfo ────────────────────────────────────────────────────────────

describe('readVideoInfo', () => {
  it('reads the length, the picture size and when it was recorded', async () => {
    const info = await readVideoInfo(fileOf(ftyp, movie(), mdat));
    expect(info).toEqual({ seconds: 41.2, durationS: 42, width: 1920, height: 1080, recordedAt: '2025-06-14T09:00:00.000Z' });
  });

  it('turns the size of a video filmed upright', async () => {
    const file = fileOf(ftyp, box('moov', mvhd(), box('trak', tkhd(1920, 1080, { quarterTurn: true }))), mdat);
    expect(await readVideoInfo(file)).toMatchObject({ width: 1080, height: 1920 });
  });

  it('reads a version 1 header, with 64-bit times', async () => {
    const created = quickTime('2024-02-29T12:00:00Z');
    const file = fileOf(ftyp, box('moov', mvhd64({ timescale: 600, duration: 2 ** 33, created })), mdat);
    const info = await readVideoInfo(file);
    expect(info.seconds).toBeCloseTo(2 ** 33 / 600, 6);
    expect(info.recordedAt).toBe('2024-02-29T12:00:00.000Z');
    expect(info.width).toBeNull();
  });

  it('says nothing it can’t know: no header, no timescale, a date unset or to come', async () => {
    expect(await readVideoInfo(fileOf(ftyp, box('moov', trakOf('avc1', [0, 0])), mdat))).toEqual({
      seconds: null,
      durationS: null,
      width: null,
      height: null,
      recordedAt: null,
    });
    const unset = await readVideoInfo(fileOf(box('moov', mvhd({ timescale: 0, created: 0 }))));
    expect(unset).toMatchObject({ seconds: null, durationS: null, recordedAt: null });
    const later = await readVideoInfo(fileOf(box('moov', mvhd({ created: quickTime('2030-01-01T00:00:00Z') }))));
    expect(later.recordedAt).toBeNull();
  });

  it('rounds a short video up to one second', async () => {
    expect((await readVideoInfo(fileOf(box('moov', mvhd({ timescale: 1000, duration: 200 }))))).durationS).toBe(1);
  });

  it('reads past a big mdat with a 64-bit size, one running to the end, and zeros at the end', async () => {
    const bigMdat = [...u32(1), ...bytesOf('mdat'), ...u64(16 + 4), 1, 2, 3, 4];
    expect((await readVideoInfo(fileOf(ftyp, bigMdat, movie(), zeros(5)))).seconds).toBe(41.2);
    const toTheEnd = [...u32(0), ...bytesOf('mdat'), 9, 9, 9];
    expect((await readVideoInfo(fileOf(ftyp, movie(), toTheEnd))).seconds).toBe(41.2);
  });

  it('refuses a file it can’t read well enough to check', async () => {
    const refusals = [
      fileOf(bytesOf('this is not a video at all, just words')),
      fileOf(ftyp, mdat),
      fileOf(ftyp, movie(), movie()),
      fileOf(ftyp, movie(), [1, 2, 3]),
      fileOf(ftyp, [...u32(999), ...bytesOf('moov')], zeros(20)),
      fileOf(box('moov', mvhd(), [0, 0, 0, 3, 1, 2, 3, 4, 5, 6, 7, 8])),
    ];
    for (const file of refusals) {
      const error = await readVideoInfo(file).catch((err) => err);
      expect(error).toBeInstanceOf(UncheckableVideoError);
      expect(error.message).toBe(VIDEO_CHECK_FAILED);
      expect(error.name).toBe('UncheckableVideoError');
    }
  });
});

// ── stripVideoLocation ───────────────────────────────────────────────────────

describe('stripVideoLocation', () => {
  it('blanks the place boxes in the user data, keeping the file the same size and everything else the same', async () => {
    const udta = box('udta', box('©xyz', [0, 18, 0x15, 0xc7], bytesOf('+35.0116+135.7681/')), box('loci', bytesOf('Kyoto')), box('©nam', bytesOf('Temple')));
    const file = fileOf(ftyp, movie(udta), mdat);
    const original = await bytesFrom(file);
    const cleaned = await stripVideoLocation(file, { type: 'video/quicktime' });
    const bytes = await bytesFrom(cleaned);

    expect(cleaned.type).toBe('video/quicktime');
    expect(bytes.length).toBe(original.length);
    expect(hasLocationMarker(bytes)).toBe(false);
    expect(indexOfText(bytes, '+35.0116')).toBe(-1);
    expect(indexOfText(bytes, 'Kyoto')).toBe(-1);
    expect(indexOfText(bytes, 'Temple')).not.toBe(-1);
    // The ftyp before the movie and the mdat after it are untouched
    expect(bytes.subarray(0, ftyp.length)).toEqual(original.subarray(0, ftyp.length));
    expect(bytes.subarray(bytes.length - mdat.length)).toEqual(original.subarray(original.length - mdat.length));
    // Each place box is now a free box of the same size
    const freeAt = indexOfText(bytes, 'free');
    expect(freeAt).toBe(indexOfText(original, '©xyz'));
  });

  it('renames QuickTime’s location keys and zeroes their values, keeping the other keys', async () => {
    const locationKey = 'com.apple.quicktime.location.ISO6709';
    const makeKey = 'com.apple.quicktime.make';
    const keys = box('keys', [0, 0, 0, 0], u32(2), box('mdta', bytesOf(locationKey)), box('mdta', bytesOf(makeKey)));
    const value = (text) => box('data', u32(1), u32(0), bytesOf(text));
    const ilst = box('ilst', box(u32(1), value('+35.0116+135.7681/')), box(u32(2), value('Apple')));
    const meta = box('meta', box('hdlr', zeros(25)), keys, ilst);
    const file = fileOf(ftyp, movie(meta), mdat);
    const bytes = await bytesFrom(await stripVideoLocation(file));

    expect(indexOfText(bytes, locationKey)).toBe(-1);
    expect(indexOfText(bytes, 'removed.1.')).not.toBe(-1);
    expect(indexOfText(bytes, 'removed.1.'.padEnd(locationKey.length, 'x'))).not.toBe(-1);
    expect(indexOfText(bytes, '+35.0116')).toBe(-1);
    expect(indexOfText(bytes, makeKey)).not.toBe(-1);
    expect(indexOfText(bytes, 'Apple')).not.toBe(-1);
  });

  it('cleans an ISO meta box in the user data, after its version and flags', async () => {
    const meta = box('meta', [0, 0, 0, 0], box('hdlr', zeros(25)), box('ilst', box('©xyz', bytesOf('+51.5+000.1/'))));
    const bytes = await bytesFrom(await stripVideoLocation(fileOf(ftyp, movie(box('udta', meta)), mdat)));
    expect(hasLocationMarker(bytes)).toBe(false);
    expect(indexOfText(bytes, '+51.5')).toBe(-1);
  });

  it('blanks XMP kept in the user data', async () => {
    const xmp = box('XMP_', bytesOf('<exif:GPSLatitude>35,0.7N</exif:GPSLatitude>'));
    const bytes = await bytesFrom(await stripVideoLocation(fileOf(ftyp, movie(box('udta', xmp)), mdat)));
    expect(indexOfText(bytes, 'GPSLatitude')).toBe(-1);
  });

  it.each(['gpmd', 'camm', 'djmd'])('refuses a video with a %s GPS track of its own', async (format) => {
    const file = fileOf(ftyp, box('moov', mvhd(), trakOf('avc1', [1920, 1080]), trakOf(format)), mdat);
    const error = await stripVideoLocation(file).catch((err) => err);
    expect(error).toBeInstanceOf(UncheckableVideoError);
    expect(error.message).toBe(VIDEO_HAS_GPS_TRACK);
  });

  it('refuses XMP with GPS at the top level, and user data outside the movie', async () => {
    const uuid = box('uuid', zeros(16), bytesOf('<x:xmpmeta><exif:GPSLongitude>135</exif:GPSLongitude></x:xmpmeta>'));
    await expect(stripVideoLocation(fileOf(ftyp, movie(), uuid, mdat))).rejects.toThrow(VIDEO_CHECK_FAILED);
    const topUdta = box('udta', box('©xyz', bytesOf('+35+135/')));
    await expect(stripVideoLocation(fileOf(ftyp, movie(), topUdta, mdat))).rejects.toThrow(VIDEO_CHECK_FAILED);
  });

  it('keeps top-level metadata with no location', async () => {
    const uuid = box('uuid', zeros(16), bytesOf('<x:xmpmeta><dc:title>Trip</dc:title></x:xmpmeta>'));
    const file = fileOf(ftyp, movie(), uuid, mdat);
    expect((await stripVideoLocation(file)).size).toBe(file.size);
  });

  it('refuses a location left where it can’t be taken out', async () => {
    const odd = box('ABCD', bytesOf('com.apple.quicktime.location.ISO6709 +35+135/'));
    await expect(stripVideoLocation(fileOf(ftyp, movie(odd), mdat))).rejects.toThrow(VIDEO_CHECK_FAILED);
  });
});

// ── Which files are videos ───────────────────────────────────────────────────

describe('hasLocationMarker', () => {
  it('finds the server’s markers and XMP’s GPS fields', () => {
    expect(hasLocationMarker(Uint8Array.from(bytesOf('..©xyz..')))).toBe(true);
    expect(hasLocationMarker(Uint8Array.from(bytesOf('com.apple.quicktime.location.ISO6709')))).toBe(true);
    expect(hasLocationMarker(Uint8Array.from(bytesOf('GPSLongitude')))).toBe(true);
    expect(hasLocationMarker(Uint8Array.from(bytesOf('GPSLat')))).toBe(false);
    expect(hasLocationMarker(new Uint8Array(0))).toBe(false);
  });
});

describe('videoContentType and isVideoFile', () => {
  it('gives the type a video is uploaded as, by type or by name', () => {
    expect(videoContentType({ type: 'video/mp4', name: 'a' })).toBe('video/mp4');
    expect(videoContentType({ type: 'VIDEO/QUICKTIME', name: 'a' })).toBe('video/quicktime');
    expect(videoContentType({ type: 'video/x-m4v', name: 'a' })).toBe('video/mp4');
    expect(videoContentType({ type: '', name: 'clip.M4V' })).toBe('video/mp4');
    expect(videoContentType({ type: 'application/octet-stream', name: 'clip.qt' })).toBe('video/quicktime');
    expect(videoContentType({ type: 'video/webm', name: 'clip.mp4' })).toBeNull();
    expect(videoContentType({ type: '', name: 'clip.avi' })).toBeNull();
    expect(videoContentType({ type: '', name: undefined })).toBeNull();
  });

  it('knows any video, so it’s refused as a video rather than a photo', () => {
    expect(isVideoFile({ type: 'video/webm', name: 'a' })).toBe(true);
    expect(isVideoFile({ type: '', name: 'a.MKV' })).toBe(true);
    expect(isVideoFile({ type: 'image/jpeg', name: 'a.jpg' })).toBe(false);
  });
});
