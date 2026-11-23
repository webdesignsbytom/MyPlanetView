import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_UPLOAD_ORIGIN } from '@/dev/mock/mockAdapter';
import {
  GENERIC_MAX_BYTES,
  UPLOAD_IMAGE_EXTENSIONS,
  confirmMockUpload,
  declaredSizeProblem,
  mockUpload,
  presignMockUpload,
  receiveMockUpload,
  videoStillHasLocation,
} from '@/dev/mock/uploads';
import { session } from '@/dev/mock/store';
import { box, freshStore, polyfillBlobReads, stubObjectUrls, videoBlob } from './mockApi';

polyfillBlobReads();

beforeEach(() => {
  freshStore();
  stubObjectUrls();
});

describe('declaredSizeProblem', () => {
  it('passes a whole, positive size within the limit', () => {
    expect(declaredSizeProblem(1, 10)).toBeNull();
    expect(declaredSizeProblem(10, 10)).toBeNull();
  });

  it('asks for a size when it is missing, not whole or not positive', () => {
    for (const bytes of [undefined, null, 0, -5, 1.5, '10', Number.NaN, 2 ** 60]) {
      expect(declaredSizeProblem(bytes, 10)?.[0]).toBe(400);
    }
  });

  it('answers 413 above the limit', () => {
    expect(declaredSizeProblem(11, 10)).toEqual([413, 'That file is too large.']);
  });

  it('takes the generic uploads’ types and 5 MB, as the server', () => {
    expect(Object.keys(UPLOAD_IMAGE_EXTENSIONS)).toEqual(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
    expect(UPLOAD_IMAGE_EXTENSIONS['image/jpeg']).toBe('jpg');
    expect(GENERIC_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe('presigned uploads', () => {
  const key = 'myplanetview/photos/map-home/p1/thumb-abc.jpg';

  it('signs a URL on the mock bucket for the key, and records what it was signed for', () => {
    const url = presignMockUpload(key, { resource: 'photo', contentType: 'image/jpeg', bytes: 3, ownerId: 'mock-user' });
    expect(url.startsWith(`${MOCK_UPLOAD_ORIGIN}/${encodeURIComponent(key)}?`)).toBe(true);
    expect(url).toContain('X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost');
    expect(mockUpload(key)).toMatchObject({ resource: 'photo', contentType: 'image/jpeg', bytes: 3, ownerId: 'mock-user', confirmed: false });
  });

  it('keeps a PUT of exactly what was signed, as a session blob', async () => {
    const url = presignMockUpload(key, { resource: 'photo', contentType: 'image/jpeg', bytes: 3 });
    expect(await receiveMockUpload(url, new Blob(['abc']), 'image/jpeg')).toBe(200);
    expect(session.blobs.get(key)).toMatch(/^blob:mock\//);
  });

  it('refuses (403) a PUT with another type, another size, no file or no signature', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const url = presignMockUpload(key, { resource: 'photo', contentType: 'image/jpeg', bytes: 3 });
    expect(await receiveMockUpload(url, new Blob(['abc']), 'image/png')).toBe(403);
    expect(await receiveMockUpload(url, new Blob(['abcd']), 'image/jpeg')).toBe(403);
    expect(await receiveMockUpload(url, 'abc', 'image/jpeg')).toBe(403);
    expect(await receiveMockUpload(`${MOCK_UPLOAD_ORIGIN}/never-signed`, new Blob(['abc']), 'image/jpeg')).toBe(403);
    expect(session.blobs.has(key)).toBe(false);
    expect(warn).toHaveBeenCalledTimes(4);
  });

  it('confirms only an upload that was signed and arrived', () => {
    presignMockUpload(key, { resource: 'photo', contentType: 'image/jpeg', bytes: 3 });
    expect(confirmMockUpload('unknown', true)).toBeNull();
    expect(confirmMockUpload(key, false)).toBeNull();
    expect(confirmMockUpload(key, true).confirmed).toBe(true);
  });
});

describe('videoStillHasLocation', () => {
  const ftyp = box('ftyp', 'isom', new Uint8Array(4));

  it('passes a movie box with no location in it', async () => {
    expect(await videoStillHasLocation(videoBlob(ftyp, box('moov', box('mvhd', new Uint8Array(20)))))).toBe(false);
  });

  it('finds an ©xyz location', async () => {
    const xyz = box('udta', new Uint8Array([0xa9, 0x78, 0x79, 0x7a]), '+51.5-000.1/');
    expect(await videoStillHasLocation(videoBlob(ftyp, box('moov', xyz)))).toBe(true);
  });

  it('finds QuickTime’s location key', async () => {
    expect(await videoStillHasLocation(videoBlob(ftyp, box('moov', box('keys', 'com.apple.quicktime.location.ISO6709'))))).toBe(true);
  });

  it('treats a file with no movie box, or a broken box, as holding one', async () => {
    expect(await videoStillHasLocation(videoBlob(ftyp, box('mdat', new Uint8Array(8))))).toBe(true);
    const broken = box('ftyp', 'isom');
    new DataView(broken.buffer).setUint32(0, 4000);
    expect(await videoStillHasLocation(videoBlob(broken))).toBe(true);
    expect(await videoStillHasLocation(new Blob([]))).toBe(true);
  });

  it('reads a box whose size is 0 (to the end of the file)', async () => {
    const moov = box('moov', box('mvhd', new Uint8Array(8)));
    new DataView(moov.buffer).setUint32(0, 0);
    expect(await videoStillHasLocation(videoBlob(ftyp, moov))).toBe(false);
  });
});
