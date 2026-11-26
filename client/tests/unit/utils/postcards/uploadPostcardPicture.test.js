// A photo of the sender's own for a postcard (utils/postcards/uploadPostcardPicture.js)
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POSTCARD_PICTURE_EDGE, isPictureFile, photoAsBlob, uploadPostcardPicture } from '@/utils/postcards/uploadPostcardPicture';
import { presignPostcardPicture } from '@/api/postcardsApi';
import { decode, encode } from '@/utils/photos/makePhotoCopies';
import { putFile } from '@/utils/photos/putFile';

vi.mock('@/api/postcardsApi', () => ({ presignPostcardPicture: vi.fn() }));
vi.mock('@/utils/photos/makePhotoCopies', () => ({ decode: vi.fn(), encode: vi.fn() }));
vi.mock('@/utils/photos/putFile', () => ({ putFile: vi.fn() }));

const bitmap = { close: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  decode.mockResolvedValue(bitmap);
  encode.mockResolvedValue({ blob: new Blob(['x'.repeat(50)], { type: 'image/webp' }), contentType: 'image/webp' });
  presignPostcardPicture.mockResolvedValue({ key: 'myplanetview/postcards/u/card-a.webp', upload: { url: 'https://bucket/put' } });
  putFile.mockImplementation(async (url, blob, type, onProgress) => onProgress?.(blob.size));
  URL.createObjectURL = vi.fn(() => 'blob:preview');
});

describe('isPictureFile', () => {
  it('takes pictures, never an iPhone HEIC', () => {
    expect(isPictureFile(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBe(true);
    expect(isPictureFile(new File(['x'], 'a.png', { type: '' }))).toBe(true);
    expect(isPictureFile(new File(['x'], 'a.heic', { type: 'image/heic' }))).toBe(false);
    expect(isPictureFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe(false);
    expect(isPictureFile(null)).toBe(false);
  });
});

describe('uploadPostcardPicture', () => {
  it('draws the picture again (no camera details), sends it to the private bucket, and gives its key and a preview', async () => {
    const progress = vi.fn();
    const file = new File(['raw'], 'holiday.jpg', { type: 'image/jpeg' });
    await expect(uploadPostcardPicture(file, progress)).resolves.toEqual({ key: 'myplanetview/postcards/u/card-a.webp', previewUrl: 'blob:preview' });
    expect(decode).toHaveBeenCalledWith(file);
    expect(encode).toHaveBeenCalledWith(bitmap, POSTCARD_PICTURE_EDGE, expect.any(Number));
    expect(bitmap.close).toHaveBeenCalled();
    expect(presignPostcardPicture).toHaveBeenCalledWith({ contentType: 'image/webp', bytes: 50 });
    expect(putFile).toHaveBeenCalledWith('https://bucket/put', expect.any(Blob), 'image/webp', expect.any(Function), 50);
    expect(progress).toHaveBeenLastCalledWith(1);
  });

  it('takes a blob (one of the map’s photos, fetched) as well as a file', async () => {
    await expect(uploadPostcardPicture(new Blob(['raw'], { type: 'image/webp' }))).resolves.toMatchObject({ key: expect.any(String) });
  });

  it('turns away what it can’t send, saying why', async () => {
    await expect(uploadPostcardPicture(new File(['x'], 'IMG_1.HEIC'))).rejects.toThrow('HEIC');
    await expect(uploadPostcardPicture(new File(['x'], 'notes.txt', { type: 'text/plain' }))).rejects.toThrow('Please choose a photo.');
    await expect(uploadPostcardPicture(null)).rejects.toThrow('Please choose a photo.');
    encode.mockResolvedValue({ blob: { size: 9 * 1024 * 1024 }, contentType: 'image/jpeg' });
    await expect(uploadPostcardPicture(new File(['x'], 'big.jpg', { type: 'image/jpeg' }))).rejects.toThrow('too detailed');
    expect(presignPostcardPicture).not.toHaveBeenCalled();
  });
});

describe('photoAsBlob', () => {
  it('fetches a photo’s copy from where it’s kept, and says so when it can’t', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, blob: async () => new Blob(['img']) }));
    await expect(photoAsBlob('https://bucket/p.webp')).resolves.toBeInstanceOf(Blob);
    expect(fetch).toHaveBeenCalledWith('https://bucket/p.webp', { mode: 'cors', credentials: 'omit' });
    fetch.mockResolvedValueOnce({ ok: false });
    await expect(photoAsBlob('https://bucket/p.webp')).rejects.toThrow('couldn’t be fetched');
  });
});
