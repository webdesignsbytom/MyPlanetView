import { beforeEach, describe, expect, it, vi } from 'vitest';

const parse = vi.fn();
vi.mock('exifr/dist/lite.esm.mjs', () => ({ default: { parse: (...args) => parse(...args) } }));

import { readPhotoMeta } from '@/utils/photos/readPhotoMeta';

const none = { takenAt: null, latitude: null, longitude: null };
const file = new Blob(['jpeg'], { type: 'image/jpeg' });

beforeEach(() => parse.mockReset());

describe('readPhotoMeta', () => {
  it('reads when and where a photo was taken', async () => {
    parse.mockResolvedValue({ DateTimeOriginal: new Date('2025-06-14T09:30:00Z'), latitude: 35.0116, longitude: 135.7681 });
    expect(await readPhotoMeta(file)).toEqual({ takenAt: '2025-06-14T09:30:00.000Z', latitude: 35.0116, longitude: 135.7681 });
    expect(parse).toHaveBeenCalledWith(file, expect.objectContaining({ exif: true, gps: true, xmp: false }));
  });

  it('falls back to the creation date, then the file’s date', async () => {
    parse.mockResolvedValueOnce({ CreateDate: new Date('2024-01-02T00:00:00Z') });
    expect((await readPhotoMeta(file)).takenAt).toBe('2024-01-02T00:00:00.000Z');
    parse.mockResolvedValueOnce({ DateTime: new Date('2023-05-06T00:00:00Z') });
    expect((await readPhotoMeta(file)).takenAt).toBe('2023-05-06T00:00:00.000Z');
  });

  it('ignores a date that isn’t one', async () => {
    parse.mockResolvedValueOnce({ DateTimeOriginal: new Date('nonsense') });
    expect((await readPhotoMeta(file)).takenAt).toBeNull();
    parse.mockResolvedValueOnce({ DateTimeOriginal: '2025:06:14 09:30:00' });
    expect((await readPhotoMeta(file)).takenAt).toBeNull();
  });

  it('ignores 0,0 (no fix) and half a position', async () => {
    parse.mockResolvedValueOnce({ latitude: 0, longitude: 0 });
    expect(await readPhotoMeta(file)).toEqual(none);
    parse.mockResolvedValueOnce({ latitude: 51.5, longitude: undefined });
    expect(await readPhotoMeta(file)).toEqual(none);
    parse.mockResolvedValueOnce({ latitude: 0, longitude: 12 });
    expect(await readPhotoMeta(file)).toEqual({ takenAt: null, latitude: 0, longitude: 12 });
  });

  it('gives nothing for a file with no EXIF, or one it can’t read', async () => {
    parse.mockResolvedValueOnce(undefined);
    expect(await readPhotoMeta(file)).toEqual(none);
    parse.mockRejectedValueOnce(new Error('Unknown file format'));
    expect(await readPhotoMeta(file)).toEqual(none);
  });
});
