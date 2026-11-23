import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/travelApi', () => ({ getPhotoPage: vi.fn() }));

import { getPhotoPage } from '@/api/travelApi';
import {
  DOWNLOAD_PAGE_SIZE,
  PART_MAX_BYTES,
  extensionFor,
  formatBytes,
  listDownloadFiles,
  relistPage,
  safeName,
  splitIntoParts,
  zipEntries,
  zipFileName,
} from '@/utils/photos/photoDownload';

beforeEach(() => getPhotoPage.mockReset());

describe('safeName', () => {
  it('takes out what file systems refuse, and squeezes spaces', () => {
    expect(safeName('Paris: day 1 / 2 * "best"?')).toBe('Paris day 1 2 best');
    expect(safeName('tab\there\u0000now')).toBe('tab here now');
    expect(safeName('...hidden...')).toBe('hidden');
  });

  it('is never empty, "." or ".."', () => {
    expect(safeName('')).toBe('Photo');
    expect(safeName('..')).toBe('Photo');
    expect(safeName(null, 'My photos')).toBe('My photos');
    expect(safeName('///')).toBe('Photo');
  });

  it('cuts a long name to 80 characters', () => {
    expect(safeName('a'.repeat(200))).toHaveLength(80);
  });
});

describe('extensionFor', () => {
  it('gives each type its extension, JPEG for anything else', () => {
    expect(extensionFor('image/png')).toBe('png');
    expect(extensionFor('image/webp')).toBe('webp');
    expect(extensionFor('image/avif')).toBe('avif');
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('image/heic')).toBe('jpg');
  });
});

describe('zipEntries', () => {
  const best = (extra) => ({ url: 'https://bucket.example/x', contentType: 'image/jpeg', bytes: 1000, copy: 'ORIGINAL', ...extra });

  it('names each file by its day and caption, numbering twins', () => {
    const photos = [
      { id: 1, takenAt: '2025-06-14T10:00:00+09:00', caption: 'Temple', best: best(), page: 0 },
      { id: 2, takenAt: '2025-06-14T11:00:00Z', caption: 'temple', best: best({ contentType: 'image/jpeg' }), page: 0 },
      { id: 3, caption: null, best: best({ contentType: 'image/png', bytes: undefined }), page: 1 },
      { id: 4, takenAt: 'not a date', caption: 'Mystery', best: best(), page: 1 },
    ];
    const { files, totalBytes, unknownSizes } = zipEntries(photos);
    expect(files.map((f) => f.name)).toEqual(['2025-06-14 Temple.jpg', '2025-06-14 temple (2).jpg', 'Photo.png', 'Mystery.jpg']);
    expect(files[0]).toMatchObject({ id: 1, copy: 'ORIGINAL', url: 'https://bucket.example/x', bytes: 1000, page: 0 });
    expect(files[0].lastModified).toEqual(new Date('2025-06-14T10:00:00+09:00'));
    expect(files[2].bytes).toBeNull();
    expect(totalBytes).toBe(3000);
    expect(unknownSizes).toBe(1);
  });

  it('counts videos and photos with no file instead of listing them', () => {
    const { files, videos, missing } = zipEntries([{ id: 1, kind: 'VIDEO' }, { id: 2, best: null }, { id: 3, best: { url: '' } }]);
    expect(files).toEqual([]);
    expect(videos).toBe(1);
    expect(missing).toBe(2);
  });

  it('puts each photo in its country’s folder for the whole map', () => {
    const photos = [
      { id: 1, countryCode: 'FR', caption: 'A', best: best() },
      { id: 2, countryCode: null, caption: 'A', best: best() },
      { id: 3, countryCode: 'FR', caption: 'A', best: best() },
    ];
    expect(zipEntries(photos, { byCountry: true }).files.map((f) => f.name)).toEqual(['France/A.jpg', 'No country/A.jpg', 'France/A (2).jpg']);
  });
});

describe('splitIntoParts', () => {
  it('cuts files into parts of at most the size, in order', () => {
    const files = [{ bytes: 40 }, { bytes: 40 }, { bytes: 40 }, { bytes: 200 }, { bytes: 10 }];
    expect(splitIntoParts(files, 100).map((part) => part.map((f) => f.bytes))).toEqual([[40, 40], [40], [200], [10]]);
  });

  it('counts an unknown size as a guess, and gives no parts for no files', () => {
    expect(splitIntoParts([{ bytes: null }, { bytes: null }], 5_000_000)).toHaveLength(2);
    expect(splitIntoParts([])).toEqual([]);
    expect(PART_MAX_BYTES).toBe(500_000_000);
  });
});

describe('zipFileName and formatBytes', () => {
  it('names the zip, and its parts', () => {
    expect(zipFileName('Japan: 2025')).toBe('Japan 2025.zip');
    expect(zipFileName('Japan', 2, 3)).toBe('Japan (part 2 of 3).zip');
    expect(zipFileName('')).toBe('My photos.zip');
  });

  it('words a size in decimal units', () => {
    expect(formatBytes(0)).toBe('0 MB');
    expect(formatBytes(NaN)).toBe('0 MB');
    expect(formatBytes(400)).toBe('1 KB');
    expect(formatBytes(85_000)).toBe('85 KB');
    expect(formatBytes(340_400_000)).toBe('340 MB');
    expect(formatBytes(1_234_000_000)).toBe('1.2 GB');
    expect(formatBytes(12_340_000_000)).toBe('12 GB');
  });
});

describe('listDownloadFiles', () => {
  it('pages through the list with the best copies, noting each page', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    getPhotoPage.mockResolvedValueOnce({ photos: [{ id: 1 }, { id: 2 }], nextCursor: 'c2' }).mockResolvedValueOnce({ photos: [{ id: 3 }], nextCursor: null });
    const onProgress = vi.fn();
    const result = await listDownloadFiles({ mapId: 'm', country: 'FR' }, { onProgress });
    expect(getPhotoPage).toHaveBeenNthCalledWith(1, { mapId: 'm', country: 'FR', cursor: undefined, limit: DOWNLOAD_PAGE_SIZE, best: true });
    expect(getPhotoPage).toHaveBeenNthCalledWith(2, { mapId: 'm', country: 'FR', cursor: 'c2', limit: DOWNLOAD_PAGE_SIZE, best: true });
    expect(result).toEqual({
      photos: [
        { id: 1, page: 0 },
        { id: 2, page: 0 },
        { id: 3, page: 1 },
      ],
      pages: [
        { cursor: undefined, listedAt: 1000 },
        { cursor: 'c2', listedAt: 1000 },
      ],
    });
    expect(onProgress.mock.calls).toEqual([[2], [3]]);
  });

  it('stops when the download is stopped', async () => {
    const controller = new AbortController();
    getPhotoPage.mockImplementation(async () => {
      controller.abort();
      return { photos: [], nextCursor: 'more' };
    });
    await expect(listDownloadFiles({ tripId: 't' }, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('relistPage', () => {
  it('lists one page again for fresh links, and notes when', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(5000);
    getPhotoPage.mockResolvedValue({ photos: [{ id: 1, best: { url: 'u1' } }, { id: 2, best: null }] });
    const page = { cursor: 'c2', listedAt: 1 };
    const fresh = await relistPage({ mapId: 'm' }, page);
    expect(getPhotoPage).toHaveBeenCalledWith({ mapId: 'm', cursor: 'c2', limit: DOWNLOAD_PAGE_SIZE, best: true });
    expect([...fresh]).toEqual([
      [1, { url: 'u1' }],
      [2, null],
    ]);
    expect(page.listedAt).toBe(5000);
  });
});
