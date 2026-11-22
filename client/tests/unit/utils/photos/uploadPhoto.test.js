import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/travelApi', () => ({ presignPhoto: vi.fn(), createPhoto: vi.fn() }));
vi.mock('@/utils/photos/readPhotoMeta', () => ({ readPhotoMeta: vi.fn() }));
vi.mock('@/utils/photos/putFile', () => ({ putFiles: vi.fn() }));
vi.mock('@/utils/photos/makePhotoCopies', async (importOriginal) => ({ ...(await importOriginal()), makePhotoCopies: vi.fn() }));

import { createPhoto, presignPhoto } from '@/api/travelApi';
import { readPhotoMeta } from '@/utils/photos/readPhotoMeta';
import { putFiles } from '@/utils/photos/putFile';
import { makePhotoCopies } from '@/utils/photos/makePhotoCopies';
import { LOCKED_MAP, PHOTO_MAX_BYTES, VIDEO_CONTENT_TYPES, VIDEO_MAX_BYTES, uploadPhoto } from '@/utils/photos/uploadPhoto';

const MB = 1024 * 1024;
const sized = (bytes, type = 'image/webp') => ({ size: bytes, type });
const photoFile = (extra = {}) => Object.assign(new Blob([new Uint8Array(2000)], { type: 'image/jpeg' }), { name: 'IMG_1.jpg' }, extra);

beforeEach(() => {
  vi.clearAllMocks();
  readPhotoMeta.mockResolvedValue({ takenAt: null, latitude: null, longitude: null });
  makePhotoCopies.mockImplementation(async (file, { print }) => ({
    width: 4000,
    height: 3000,
    thumb: { blob: sized(100), width: 400, height: 300, contentType: 'image/webp' },
    display: { blob: sized(500), width: 1600, height: 1200, contentType: 'image/webp' },
    ...(print ? { print: { blob: sized(900, 'image/jpeg'), width: 2400, height: 1800, contentType: 'image/jpeg' } } : {}),
  }));
  presignPhoto.mockResolvedValue({ photoId: 'p1', uploads: [] });
  putFiles.mockImplementation(async (files) => Object.fromEntries(files.map((f) => [f.size, `key/${f.size}`])));
  createPhoto.mockResolvedValue({ photo: { id: 'p1' } });
});

describe('the caps', () => {
  it('are the server’s', () => {
    expect(PHOTO_MAX_BYTES).toEqual({ THUMB: 1 * MB, DISPLAY: 5 * MB, ORIGINAL: 50 * MB, PRINT: 5 * MB });
    expect(VIDEO_CONTENT_TYPES).toEqual(['video/mp4', 'video/quicktime']);
    expect(VIDEO_MAX_BYTES).toBe(500 * MB);
  });
});

describe('uploadPhoto refuses before anything starts', () => {
  it('a locked map', async () => {
    await expect(uploadPhoto({ mapId: 'm', file: photoFile(), uploadRules: { locked: true } })).rejects.toThrow(LOCKED_MAP);
  });

  it('a HEIC photo, by type or by name', async () => {
    await expect(uploadPhoto({ mapId: 'm', file: { type: '', name: 'IMG.HEIC', size: 10 } })).rejects.toThrow(/This is a HEIC photo/);
  });

  it('a type the server doesn’t keep', async () => {
    await expect(uploadPhoto({ mapId: 'm', file: { type: 'image/gif', name: 'a.gif', size: 10 } })).rejects.toThrow('Only JPEG, PNG and WebP photos can be added.');
  });

  it('a photo over 50 MB', async () => {
    await expect(uploadPhoto({ mapId: 'm', file: { type: 'image/jpeg', name: 'a.jpg', size: 50 * MB + 1 } })).rejects.toThrow('This photo is over 50 MB.');
    expect(presignPhoto).not.toHaveBeenCalled();
  });

  it('a copy over its cap', async () => {
    makePhotoCopies.mockResolvedValueOnce({ width: 1, height: 1, thumb: { blob: sized(2 * MB) }, display: { blob: sized(10) } });
    await expect(uploadPhoto({ mapId: 'm', file: photoFile() })).rejects.toThrow('This photo is too large to add.');
    expect(presignPhoto).not.toHaveBeenCalled();
  });
});

describe('uploadPhoto', () => {
  it('keeps the untouched original on Business and First Class, going through every stage', async () => {
    const file = photoFile();
    const stages = [];
    const onProgress = vi.fn();
    readPhotoMeta.mockResolvedValue({ takenAt: '2025-06-14T09:00:00.000Z', latitude: 35, longitude: 135 });
    const result = await uploadPhoto({ mapId: 'm', tripId: 't', file, countryCode: 'JP', uploadRules: { keepsOriginals: true }, onStage: (s) => stages.push(s), onProgress });

    expect(result).toEqual({ photo: { id: 'p1' }, hadLocation: true });
    expect(stages).toEqual(['reading', 'resizing', 'uploading', 'saving']);
    expect(makePhotoCopies).toHaveBeenCalledWith(file, { print: false });
    expect(presignPhoto).toHaveBeenCalledWith('m', {
      tripId: 't',
      importedFrom: undefined,
      countryCode: undefined,
      files: [
        { size: 'THUMB', contentType: 'image/webp', bytes: 100 },
        { size: 'DISPLAY', contentType: 'image/webp', bytes: 500 },
        { size: 'ORIGINAL', contentType: 'image/jpeg', bytes: 2000 },
      ],
    });
    expect(putFiles.mock.calls[0][0][2]).toMatchObject({ size: 'ORIGINAL', blob: file, bytes: 2000 });
    expect(putFiles.mock.calls[0][2]).toBe(onProgress);
    expect(createPhoto).toHaveBeenCalledWith('m', {
      photoId: 'p1',
      tripId: 't',
      takenAt: '2025-06-14T09:00:00.000Z',
      importedFrom: undefined,
      latitude: 35,
      longitude: 135,
      countryCode: 'JP',
      width: 4000,
      height: 3000,
      variants: [
        { size: 'THUMB', key: 'key/THUMB', width: 400, height: 300 },
        { size: 'DISPLAY', key: 'key/DISPLAY', width: 1600, height: 1200 },
        { size: 'ORIGINAL', key: 'key/ORIGINAL', width: 4000, height: 3000 },
      ],
    });
  });

  it('keeps the original when the map gives no rules', async () => {
    await uploadPhoto({ mapId: 'm', file: photoFile() });
    expect(makePhotoCopies).toHaveBeenCalledWith(expect.anything(), { print: false });
    expect(presignPhoto.mock.calls[0][1].files.map((f) => f.size)).toEqual(['THUMB', 'DISPLAY', 'ORIGINAL']);
  });

  it('sends a PRINT copy instead of the original on an Economy map', async () => {
    await uploadPhoto({ mapId: 'm', file: photoFile(), uploadRules: { keepsOriginals: false } });
    expect(makePhotoCopies).toHaveBeenCalledWith(expect.anything(), { print: true });
    expect(presignPhoto.mock.calls[0][1].files).toEqual([
      { size: 'THUMB', contentType: 'image/webp', bytes: 100 },
      { size: 'DISPLAY', contentType: 'image/webp', bytes: 500 },
      { size: 'PRINT', contentType: 'image/jpeg', bytes: 900 },
    ]);
    expect(createPhoto.mock.calls[0][1].variants[2]).toEqual({ size: 'PRINT', key: 'key/PRINT', width: 2400, height: 1800 });
  });

  it('hints the chosen country at presign only for a photo with no location', async () => {
    const result = await uploadPhoto({ mapId: 'm', file: photoFile(), countryCode: 'FR' });
    expect(result.hadLocation).toBe(false);
    expect(presignPhoto.mock.calls[0][1].countryCode).toBe('FR');
    expect(createPhoto.mock.calls[0][1]).toMatchObject({ countryCode: 'FR', latitude: undefined, longitude: undefined, tripId: undefined });
  });

  it('carries an import’s key, and its date when the file has none', async () => {
    await uploadPhoto({ mapId: 'm', file: photoFile(), importedFrom: 'polarsteps:photo:42', fallbackTakenAt: '2019-03-01T12:00:00Z' });
    expect(presignPhoto.mock.calls[0][1].importedFrom).toBe('polarsteps:photo:42');
    expect(createPhoto.mock.calls[0][1]).toMatchObject({ importedFrom: 'polarsteps:photo:42', takenAt: '2019-03-01T12:00:00Z' });
  });

  it('prefers the file’s own date to an import’s', async () => {
    readPhotoMeta.mockResolvedValue({ takenAt: '2019-03-02T08:00:00.000Z', latitude: null, longitude: null });
    await uploadPhoto({ mapId: 'm', file: photoFile(), importedFrom: 'k', fallbackTakenAt: '2019-03-01T12:00:00Z' });
    expect(createPhoto.mock.calls[0][1].takenAt).toBe('2019-03-02T08:00:00.000Z');
  });
});
