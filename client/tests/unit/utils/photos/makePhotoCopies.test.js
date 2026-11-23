import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DISPLAY_EDGE,
  ORIGINAL_TYPES,
  PRINT_EDGE,
  PRINT_MAX_BYTES,
  THUMB_EDGE,
  decode,
  encode,
  isHeic,
  makePhotoCopies,
} from '@/utils/photos/makePhotoCopies';

// The canvas: what was drawn at what size, and toBlob answering as `encoder` says
let drawn;
let encoder;
const fakeBlob = (type, size = 1000) => ({ type, size });

beforeEach(() => {
  drawn = [];
  encoder = (canvas, type) => fakeBlob(type);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    const canvas = this;
    return {
      set imageSmoothingQuality(value) {
        canvas.smoothing = value;
      },
      drawImage: (bitmap, x, y, width, height) => drawn.push({ bitmap, width, height, canvas: [canvas.width, canvas.height], smoothing: canvas.smoothing }),
    };
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type, quality) {
    callback(encoder(this, type, quality));
  });
});

const bitmap = (width, height) => ({ width, height, close: vi.fn() });

describe('isHeic and the types kept', () => {
  it('knows an iPhone’s own format by type or by name', () => {
    expect(isHeic({ type: 'image/heic', name: 'a.jpg' })).toBe(true);
    expect(isHeic({ type: 'image/HEIF', name: 'a' })).toBe(true);
    expect(isHeic({ type: '', name: 'IMG_0001.HEIC' })).toBe(true);
    expect(isHeic({ type: 'image/jpeg', name: 'a.jpg' })).toBe(false);
    expect(ORIGINAL_TYPES).toEqual(['image/jpeg', 'image/webp', 'image/png']);
  });
});

describe('decode', () => {
  it('reads the photo turned the way it was taken', async () => {
    const image = bitmap(10, 10);
    const create = vi.fn().mockResolvedValue(image);
    vi.stubGlobal('createImageBitmap', create);
    const file = new Blob(['x']);
    expect(await decode(file)).toBe(image);
    expect(create).toHaveBeenCalledWith(file, { imageOrientation: 'from-image' });
  });

  it('says when the browser can’t read it', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad')));
    await expect(decode(new Blob(['x']))).rejects.toThrow('This browser can’t read that file as a photo.');
  });
});

describe('encode', () => {
  it('draws the photo no bigger than the edge, as WebP', async () => {
    const result = await encode(bitmap(4000, 3000), 1600, 0.8);
    expect(result).toEqual({ blob: fakeBlob('image/webp'), width: 1600, height: 1200, contentType: 'image/webp' });
    expect(drawn[0]).toMatchObject({ width: 1600, height: 1200, canvas: [1600, 1200], smoothing: 'high' });
  });

  it('never enlarges a small photo, and keeps at least a pixel', async () => {
    expect(await encode(bitmap(300, 200), 1600, 0.8)).toMatchObject({ width: 300, height: 200 });
    expect(await encode(bitmap(10000, 1), 400, 0.8)).toMatchObject({ width: 400, height: 1 });
  });

  it('falls back to JPEG where the browser can’t write WebP', async () => {
    encoder = (canvas, type) => fakeBlob(type === 'image/webp' ? 'image/png' : type);
    expect((await encode(bitmap(100, 100), 400, 0.8)).contentType).toBe('image/jpeg');
  });

  it('says when the photo couldn’t be resized', async () => {
    encoder = () => null;
    await expect(encode(bitmap(100, 100), 400, 0.8)).rejects.toThrow('This photo couldn’t be resized.');
  });
});

describe('makePhotoCopies', () => {
  it('makes the display copy and the thumbnail, and lets the bitmap go', async () => {
    const image = bitmap(4000, 3000);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(image));
    const copies = await makePhotoCopies(new Blob(['x']));
    expect(copies).toMatchObject({ width: 4000, height: 3000, display: { width: DISPLAY_EDGE, height: 1200 }, thumb: { width: THUMB_EDGE, height: 300 } });
    expect(copies).not.toHaveProperty('print');
    expect(image.close).toHaveBeenCalled();
  });

  it('makes an Economy map’s print copy as a JPEG, lowering the quality until it fits', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap(6000, 4000)));
    const qualities = [];
    encoder = (canvas, type, quality) => {
      if (type === 'image/jpeg' && canvas.width === PRINT_EDGE) {
        qualities.push(quality);
        return fakeBlob('image/jpeg', quality > 0.7 ? PRINT_MAX_BYTES + 1 : PRINT_MAX_BYTES);
      }
      return fakeBlob(type);
    };
    const copies = await makePhotoCopies(new Blob(['x']), { print: true });
    expect(copies.print).toEqual({ blob: fakeBlob('image/jpeg', PRINT_MAX_BYTES), width: 2400, height: 1600, contentType: 'image/jpeg' });
    expect(qualities).toEqual([0.85, 0.75, 0.65]);
  });

  it('refuses a print copy it can’t fit, still letting the bitmap go', async () => {
    const image = bitmap(6000, 4000);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(image));
    encoder = (canvas, type) => fakeBlob(type, canvas.width === PRINT_EDGE ? PRINT_MAX_BYTES * 2 : 1000);
    await expect(makePhotoCopies(new Blob(['x']), { print: true })).rejects.toThrow('This photo couldn’t be made into a print copy.');
    expect(image.close).toHaveBeenCalled();
  });

  it('refuses a print copy when the browser won’t write a JPEG', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap(6000, 4000)));
    encoder = (canvas, type) => (canvas.width === PRINT_EDGE ? fakeBlob('image/png') : fakeBlob(type));
    await expect(makePhotoCopies(new Blob(['x']), { print: true })).rejects.toThrow('This photo couldn’t be made into a print copy.');
  });
});
