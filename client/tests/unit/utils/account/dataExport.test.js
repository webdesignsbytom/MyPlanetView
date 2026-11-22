import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/dataExportApi', () => ({
  getExportAccount: vi.fn(),
  getExportMap: vi.fn(),
  getExportMapPhotos: vi.fn(),
  getExportUploads: vi.fn(),
}));

import { getExportAccount, getExportMap, getExportMapPhotos, getExportUploads } from '@/api/dataExportApi';
import { buildDataExport, dataExportFileName, saveJsonFile } from '@/utils/account/dataExport';

// jsdom's Blob has no text(): read it as the browser's FileReader does
const readText = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
const photos = (prefix, count) => Array.from({ length: count }, (_, i) => ({ id: `${prefix}-${i}` }));

describe('buildDataExport', () => {
  beforeEach(() => {
    vi.mocked(getExportAccount).mockReset();
    vi.mocked(getExportMap).mockReset();
    vi.mocked(getExportMapPhotos).mockReset();
    vi.mocked(getExportUploads).mockReset();
  });

  it('joins the account, each owned map with every page of its photos, and the photos on other maps', async () => {
    getExportAccount.mockResolvedValue({
      exportedAt: '2026-11-16T10:00:00.000Z',
      account: { email: 'sam@example.com' },
      mapsYouOwn: [{ id: 'm1' }, { id: 'm2' }],
      photosOnOtherMaps: 3,
    });
    getExportMap.mockImplementation(async (id) => ({ map: { id, name: `Map ${id}` } }));
    getExportMapPhotos.mockImplementation(async (id, cursor) => {
      if (id === 'm1' && !cursor) return { photos: photos('a', 2), nextCursor: 'c2' };
      if (id === 'm1' && cursor === 'c2') return { photos: photos('b', 1), nextCursor: null };
      return { photos: [] };
    });
    getExportUploads.mockImplementationOnce(async () => ({ photos: photos('u', 2), nextCursor: 'u2' }));
    getExportUploads.mockImplementationOnce(async () => ({ photos: photos('v', 1) }));

    const file = await buildDataExport();

    expect(file.account).toEqual({ email: 'sam@example.com' });
    expect(file.maps).toEqual([
      { id: 'm1', name: 'Map m1', photos: [{ id: 'a-0' }, { id: 'a-1' }, { id: 'b-0' }] },
      { id: 'm2', name: 'Map m2', photos: [] },
    ]);
    expect(file.photosOnOtherMaps.map((p) => p.id)).toEqual(['u-0', 'u-1', 'v-0']);
    expect(getExportMapPhotos).toHaveBeenCalledWith('m1', null);
    expect(getExportMapPhotos).toHaveBeenCalledWith('m1', 'c2');
    expect(getExportUploads).toHaveBeenNthCalledWith(1, null);
    expect(getExportUploads).toHaveBeenNthCalledWith(2, 'u2');
  });

  it('says where it has got to, in sentences', async () => {
    getExportAccount.mockResolvedValue({ mapsYouOwn: [{ id: 'm1' }], photosOnOtherMaps: 0 });
    getExportMap.mockResolvedValue({ map: { id: 'm1' } });
    getExportMapPhotos.mockResolvedValueOnce({ photos: photos('a', 600), nextCursor: 'n' });
    getExportMapPhotos.mockResolvedValueOnce({ photos: photos('b', 600), nextCursor: null });
    const said = [];

    await buildDataExport({ onProgress: (words) => said.push(words) });

    expect(said).toEqual([
      'Your account',
      'Map 1 of 1',
      'Map 1 of 1: 600 photos so far',
      'Map 1 of 1: 1,200 photos so far',
      'Your photos on other people’s maps',
    ]);
  });

  it('asks for no uploads when there are none on other maps, and copes with no owned maps', async () => {
    getExportAccount.mockResolvedValue({ account: {} });

    const file = await buildDataExport();

    expect(file.maps).toEqual([]);
    expect(file.photosOnOtherMaps).toEqual([]);
    expect(getExportMap).not.toHaveBeenCalled();
    expect(getExportUploads).not.toHaveBeenCalled();
  });

  it('fails when a part fails, rather than saving half a file', async () => {
    getExportAccount.mockResolvedValue({ mapsYouOwn: [{ id: 'm1' }] });
    getExportMap.mockRejectedValue(Object.assign(new Error('boom'), { friendlyMessage: 'Map not found.' }));

    await expect(buildDataExport()).rejects.toThrow('boom');
  });
});

describe('dataExportFileName', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('names the file by the day it was made', () => {
    expect(dataExportFileName('2026-11-16T23:59:00.000Z')).toBe('my-planet-view-data-2026-11-16.json');
  });

  it('uses today when the export has no date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-02-03T12:00:00Z'));
    expect(dataExportFileName()).toBe('my-planet-view-data-2027-02-03.json');
  });
});

describe('saveJsonFile', () => {
  // jsdom has no object URLs: put fakes on URL for the test, and take them off after
  const saved = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };
  afterEach(() => {
    vi.useRealTimers();
    Object.assign(URL, saved);
  });

  it('hands the browser a pretty-printed JSON download, then lets the link go', async () => {
    vi.useFakeTimers();
    const blobs = [];
    const createObjectURL = vi.fn((blob) => {
      blobs.push(blob);
      return 'blob:export';
    });
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clicked = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordClick() {
      clicked.push({ href: this.href, download: this.download, inPage: document.body.contains(this) });
    });

    saveJsonFile({ a: 1, list: [2] }, 'my-data.json');

    expect(click).toHaveBeenCalledTimes(1);
    expect(clicked).toEqual([{ href: 'blob:export', download: 'my-data.json', inPage: true }]);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(blobs[0].type).toBe('application/json');

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(59_999);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');

    // FileReader needs the real clock
    vi.useRealTimers();
    expect(await readText(blobs[0])).toBe(JSON.stringify({ a: 1, list: [2] }, null, 2));
  });
});
