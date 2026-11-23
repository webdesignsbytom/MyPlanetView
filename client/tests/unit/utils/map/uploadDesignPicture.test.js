// @vitest-environment node
// A map design's sea picture (src/utils/map/uploadDesignPicture.js): drawn again, presigned,
// sent to the bucket, saved on the style's design. The drawing, the API and the upload are mocked.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadDesignPicture } from '@/utils/map/uploadDesignPicture';
import { DESIGN_PICTURE_EDGE, DESIGN_PICTURE_MAX_BYTES, DESIGN_PICTURE_QUALITY } from '@/utils/map/mapDesign';
import { presignDesignPicture, saveDesignPicture } from '@/api/travelApi';
import { decode, encode } from '@/utils/photos/makePhotoCopies';
import { putFile } from '@/utils/photos/putFile';

vi.mock('@/api/travelApi', () => ({ presignDesignPicture: vi.fn(), saveDesignPicture: vi.fn() }));
vi.mock('@/utils/photos/makePhotoCopies', () => ({ decode: vi.fn(), encode: vi.fn() }));
vi.mock('@/utils/photos/putFile', () => ({ putFile: vi.fn() }));

const bitmap = { close: vi.fn() };
const picture = (size = 1000) => ({ blob: { size }, contentType: 'image/webp' });
const file = (name = 'sea.jpg', type = 'image/jpeg') => ({ name, type });

beforeEach(() => {
  vi.mocked(decode).mockReset().mockResolvedValue(bitmap);
  vi.mocked(encode).mockReset().mockResolvedValue(picture());
  vi.mocked(presignDesignPicture).mockReset().mockResolvedValue({ key: 'designs/m1/sea-abc.webp', upload: { url: 'https://bucket/put' } });
  vi.mocked(putFile).mockReset().mockResolvedValue(undefined);
  vi.mocked(saveDesignPicture).mockReset().mockResolvedValue({ design: { shown: true, picture: { url: 'https://bucket/get' } } });
  bitmap.close.mockReset();
});

describe('uploadDesignPicture', () => {
  it('draws the picture again, presigns it, sends it and saves it on the style’s design', async () => {
    const design = await uploadDesignPicture('m1', 'starry', file());
    expect(encode).toHaveBeenCalledWith(bitmap, DESIGN_PICTURE_EDGE, DESIGN_PICTURE_QUALITY);
    expect(presignDesignPicture).toHaveBeenCalledWith('m1', { contentType: 'image/webp', bytes: 1000 });
    expect(putFile).toHaveBeenCalledWith('https://bucket/put', picture().blob, 'image/webp', expect.any(Function), 1000);
    expect(saveDesignPicture).toHaveBeenCalledWith('m1', 'starry', 'designs/m1/sea-abc.webp');
    expect(design).toEqual({ shown: true, picture: { url: 'https://bucket/get' } });
    expect(bitmap.close).toHaveBeenCalled();
  });

  it('reports the upload’s progress as a share of the picture', async () => {
    putFile.mockImplementation(async (_url, _blob, _type, onProgress) => {
      onProgress(250);
      onProgress(1000);
    });
    const onProgress = vi.fn();
    await uploadDesignPicture('m1', 'animated', file(), onProgress);
    expect(onProgress.mock.calls).toEqual([[0.25], [1]]);
  });

  it('needs no progress callback', async () => {
    putFile.mockImplementation(async (_url, _blob, _type, onProgress) => onProgress(500));
    await expect(uploadDesignPicture('m1', 'animated', file())).resolves.toBeTruthy();
  });

  it('takes a picture by its name when the browser gives no type', async () => {
    await uploadDesignPicture('m1', 'mono', file('IMG_0001.HEIC', ''));
    expect(decode).toHaveBeenCalled();
  });

  it('refuses a file that isn’t a picture, before drawing anything', async () => {
    await expect(uploadDesignPicture('m1', 'mono', file('notes.pdf', 'application/pdf'))).rejects.toThrow('Please choose a picture');
    await expect(uploadDesignPicture('m1', 'mono', null)).rejects.toThrow('Please choose a picture');
    expect(decode).not.toHaveBeenCalled();
  });

  it('closes the picture it read even when drawing it fails', async () => {
    encode.mockRejectedValue(new Error('no canvas'));
    await expect(uploadDesignPicture('m1', 'mono', file())).rejects.toThrow('no canvas');
    expect(bitmap.close).toHaveBeenCalled();
    expect(presignDesignPicture).not.toHaveBeenCalled();
  });

  it('refuses a picture still too big once drawn, before asking to send it', async () => {
    encode.mockResolvedValue(picture(DESIGN_PICTURE_MAX_BYTES + 1));
    await expect(uploadDesignPicture('m1', 'mono', file())).rejects.toThrow('too detailed');
    expect(presignDesignPicture).not.toHaveBeenCalled();
  });

  it('takes a picture exactly at the limit', async () => {
    encode.mockResolvedValue(picture(DESIGN_PICTURE_MAX_BYTES));
    await expect(uploadDesignPicture('m1', 'mono', file())).resolves.toBeTruthy();
  });

  it('saves nothing when the upload fails', async () => {
    putFile.mockRejectedValue(new Error('403'));
    await expect(uploadDesignPicture('m1', 'mono', file())).rejects.toThrow('403');
    expect(saveDesignPicture).not.toHaveBeenCalled();
  });

  it('works with a bitmap that can’t be closed', async () => {
    decode.mockResolvedValue({});
    await expect(uploadDesignPicture('m1', 'mono', file())).resolves.toBeTruthy();
  });
});
