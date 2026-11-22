import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('@/utils/photos/putFile', () => ({ putFile: vi.fn() }));

import client from '@/api/client';
import { putFile } from '@/utils/photos/putFile';
import { deleteMediaObject } from '@/utils/media/deleteMediaObject';
import { getSignedViewUrl } from '@/utils/media/getSignedViewUrl';
import { presignAndUpload } from '@/utils/media/uploadViaMediaService';
import { IMAGE_ACCEPT, MAX_IMAGE_SIZE_MB, UPLOAD_IMAGE_TYPES, VIDEO_ACCEPT } from '@/utils/media/mediaConstants';
import { CONFIRM_UPLOAD_API, DELETE_MEDIA_OBJECT_API, GET_MEDIA_URL_API, PRESIGN_UPLOAD_API } from '@/utils/constants/apiRoutes';
// The server's rules for the generic uploads
import { UPLOAD_IMAGE_TYPES as SERVER_IMAGE_TYPES } from '../../../../../server/src/utils/media/uploadRules.js';

beforeEach(() => {
  vi.mocked(client.get).mockReset();
  vi.mocked(client.post).mockReset();
  vi.mocked(client.delete).mockReset();
  vi.mocked(putFile).mockReset();
});

describe('mediaConstants', () => {
  it('takes the image types the server takes, and no SVG', () => {
    expect(UPLOAD_IMAGE_TYPES).toEqual([...SERVER_IMAGE_TYPES]);
    expect(IMAGE_ACCEPT).toBe('image/png,image/jpeg,image/webp,image/gif');
    expect(IMAGE_ACCEPT).not.toContain('svg');
    expect(MAX_IMAGE_SIZE_MB).toBe(5);
    expect(VIDEO_ACCEPT).toBe('video/*');
  });
});

describe('deleteMediaObject', () => {
  it('deletes by key, signed in', async () => {
    client.delete.mockResolvedValue({ status: 204 });
    await expect(deleteMediaObject({ key: 'myplanetview/avatars/a.png' })).resolves.toEqual({ ok: true });
    expect(client.delete).toHaveBeenCalledWith(DELETE_MEDIA_OBJECT_API, true, { params: { key: 'myplanetview/avatars/a.png' } });
  });

  it('says it failed, never throwing', async () => {
    client.delete.mockRejectedValue(new Error('403'));
    await expect(deleteMediaObject({ key: 'k' })).resolves.toEqual({ ok: false });
  });

  it('asks for nothing without a key', async () => {
    await expect(deleteMediaObject({})).resolves.toEqual({ ok: false });
    expect(client.delete).not.toHaveBeenCalled();
  });
});

describe('getSignedViewUrl', () => {
  it('gets a signed link for a key, for as long as the server says', async () => {
    client.get.mockResolvedValue({ data: { url: 'https://bucket/signed', expiresIn: 120 } });
    await expect(getSignedViewUrl({ key: 'k', ttl: 600 })).resolves.toEqual({ url: 'https://bucket/signed', expiresIn: 120 });
    expect(client.get).toHaveBeenCalledWith(GET_MEDIA_URL_API, true, { params: { key: 'k', ttl: 600 } });
  });

  it('asks for five minutes unless told, and assumes them when the server doesn’t say', async () => {
    client.get.mockResolvedValue({ data: { url: 'https://bucket/signed' } });
    await expect(getSignedViewUrl({ key: 'k' })).resolves.toEqual({ url: 'https://bucket/signed', expiresIn: 300 });
    expect(client.get.mock.calls[0][2].params.ttl).toBe(300);
  });

  it('gives no link on a failure, or without a key', async () => {
    client.get.mockRejectedValue(new Error('404'));
    await expect(getSignedViewUrl({ key: 'k' })).resolves.toEqual({ url: null, expiresIn: 0 });
    await expect(getSignedViewUrl({})).resolves.toEqual({ url: null, expiresIn: 0 });
    expect(client.get).toHaveBeenCalledTimes(1);
  });
});

describe('presignAndUpload', () => {
  const file = new File(['12345678'], 'me.png', { type: 'image/png' });

  it('presigns the exact type and size, puts the file as declared, then confirms it', async () => {
    client.post.mockResolvedValueOnce({ data: { url: 'https://bucket/put', key: 'myplanetview/avatars/k.png', maxBytes: 5242880, publicUrl: 'https://cdn/k.png' } });
    client.post.mockResolvedValueOnce({ data: { bytes: 8 } });
    putFile.mockImplementation(async (url, blob, type, onLoaded) => onLoaded?.(4));
    const progress = vi.fn();

    const result = await presignAndUpload({ resource: 'avatar', file, onProgress: progress });

    expect(client.post).toHaveBeenNthCalledWith(1, PRESIGN_UPLOAD_API, { resource: 'avatar', filename: 'me.png', contentType: 'image/png', bytes: 8 }, true);
    expect(putFile).toHaveBeenCalledWith('https://bucket/put', file, 'image/png', expect.any(Function), 8);
    expect(progress).toHaveBeenCalledWith(50);
    expect(client.post).toHaveBeenNthCalledWith(2, CONFIRM_UPLOAD_API, { key: 'myplanetview/avatars/k.png' }, true);
    expect(result).toEqual({ key: 'myplanetview/avatars/k.png', mimeType: 'image/png', sizeBytes: 8, publicUrl: 'https://cdn/k.png', maxBytes: 5242880 });
  });

  it('takes a given type and name, and falls back to the declared size and nulls', async () => {
    client.post.mockResolvedValueOnce({ data: { url: 'https://bucket/put', key: 'k' } });
    client.post.mockResolvedValueOnce({});
    const result = await presignAndUpload({ resource: 'contact', file, filename: 'shot.png', contentType: 'image/webp' });
    expect(client.post.mock.calls[0][1]).toMatchObject({ filename: 'shot.png', contentType: 'image/webp' });
    expect(putFile.mock.calls[0][3]).toBeUndefined();
    expect(result).toEqual({ key: 'k', mimeType: 'image/webp', sizeBytes: 8, publicUrl: null, maxBytes: null });
  });

  it('refuses without a file or a resource, and when the presign gives no link', async () => {
    await expect(presignAndUpload({ resource: 'avatar' })).rejects.toThrow('No file provided');
    await expect(presignAndUpload({ file })).rejects.toThrow('Missing resource prefix');
    client.post.mockResolvedValueOnce({ data: { key: 'k' } });
    await expect(presignAndUpload({ resource: 'avatar', file })).rejects.toThrow('Presign failed: url/key not returned');
    expect(putFile).not.toHaveBeenCalled();
  });

  it('never confirms an upload that failed', async () => {
    client.post.mockResolvedValueOnce({ data: { url: 'https://bucket/put', key: 'k' } });
    putFile.mockRejectedValue(new Error('403 from the bucket'));
    await expect(presignAndUpload({ resource: 'avatar', file })).rejects.toThrow('403 from the bucket');
    expect(client.post).toHaveBeenCalledTimes(1);
  });
});

describe('mediaUrlFrom', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const load = async () => {
    vi.resetModules();
    return (await import('@/utils/media/mediaUrl')).mediaUrlFrom;
  };

  it('builds the CDN address of a key, slashes tidied', async () => {
    vi.stubEnv('VITE_MEDIA_CDN', 'https://cdn.example.com/');
    const mediaUrlFrom = await load();
    expect(mediaUrlFrom({ objectKey: '/visitCountryPosters/fr-paris-800.avif' })).toBe('https://cdn.example.com/visitCountryPosters/fr-paris-800.avif');
  });

  it('passes a full address through, and gives # for no key', async () => {
    vi.stubEnv('VITE_MEDIA_CDN', 'https://cdn.example.com');
    const mediaUrlFrom = await load();
    expect(mediaUrlFrom({ objectKey: 'HTTPS://elsewhere.example/a.jpg' })).toBe('HTTPS://elsewhere.example/a.jpg');
    expect(mediaUrlFrom({ objectKey: '' })).toBe('#');
  });

  it('uses the repo’s media folder in development without a CDN, and nothing in a build', async () => {
    vi.stubEnv('VITE_MEDIA_CDN', '');
    vi.stubEnv('DEV', true);
    expect((await load())({ objectKey: 'landmarkPhotos/x-480.webp' })).toBe('/local-media/landmarkPhotos/x-480.webp');
    vi.stubEnv('DEV', false);
    expect((await load())({ objectKey: 'landmarkPhotos/x-480.webp' })).toBe('#');
  });
});
