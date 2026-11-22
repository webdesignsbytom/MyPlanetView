import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/travelApi', () => ({ getPhotoPage: vi.fn() }));
vi.mock('@/utils/photos/photoDownload', async (importOriginal) => ({ ...(await importOriginal()), relistPage: vi.fn() }));

import { relistPage, LINK_FRESH_MS } from '@/utils/photos/photoDownload';
import { canStreamToDisk, pickZipFile, saveZip } from '@/utils/photos/zipDownload';

const file = (id, name, url, page = 0) => ({ id, name, url, page, lastModified: new Date('2025-06-14T10:00:00Z') });
// What a zip holds, as text: a stored zip keeps names and contents as they are
// (jsdom's Blob has no arrayBuffer(), so through a FileReader)
const textOf = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(Buffer.from(reader.result).toString('latin1'));
    reader.readAsArrayBuffer(blob);
  });

let saved;
beforeEach(() => {
  relistPage.mockReset();
  saved = null;
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    saved = blob;
    return 'blob:zip';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

const answering = (bodies) =>
  vi.fn(async (url) => {
    const body = bodies[url];
    if (body instanceof Error) throw body;
    if (body === undefined) return new Response('gone', { status: 403 });
    return new Response(body);
  });

describe('canStreamToDisk', () => {
  it('says whether the browser can write straight to disk', () => {
    expect(canStreamToDisk()).toBe(false);
    window.showSaveFilePicker = () => {};
    expect(canStreamToDisk()).toBe(true);
    delete window.showSaveFilePicker;
  });
});

describe('pickZipFile', () => {
  it('asks where to save the zip and gives its writable stream', async () => {
    const writable = { kind: 'writable' };
    window.showSaveFilePicker = vi.fn().mockResolvedValue({ createWritable: async () => writable });
    try {
      expect(await pickZipFile('Japan.zip')).toBe(writable);
      expect(window.showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'Japan.zip',
        types: [{ description: 'Zip file', accept: { 'application/zip': ['.zip'] } }],
      });
    } finally {
      delete window.showSaveFilePicker;
    }
  });

  it('gives null when the person closes the dialog, and throws anything else', async () => {
    window.showSaveFilePicker = vi.fn().mockRejectedValueOnce(new DOMException('closed', 'AbortError')).mockRejectedValueOnce(new TypeError('no'));
    try {
      expect(await pickZipFile('a.zip')).toBeNull();
      await expect(pickZipFile('a.zip')).rejects.toThrow('no');
    } finally {
      delete window.showSaveFilePicker;
    }
  });
});

describe('saveZip', () => {
  const pages = () => [{ cursor: undefined, listedAt: Date.now() }];

  it('zips every file in memory and hands it to the browser’s downloads', async () => {
    const fetch = answering({ 'https://b/1': 'first-photo-bytes', 'https://b/2': 'second-photo-bytes' });
    vi.stubGlobal('fetch', fetch);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.download).toBe('Japan.zip');
    });
    const progress = [];
    const result = await saveZip({
      files: [file(1, 'Japan/one.jpg', 'https://b/1'), file(2, 'Japan/two.jpg', 'https://b/2')],
      fileName: 'Japan.zip',
      scope: { mapId: 'm' },
      pages: pages(),
      onProgress: (p) => progress.push(p),
    });

    expect(result).toEqual({ failed: [] });
    expect(click).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://b/1', expect.objectContaining({ credentials: 'omit', referrerPolicy: 'no-referrer' }));
    const text = await textOf(saved);
    expect(text.startsWith('PK')).toBe(true);
    for (const part of ['Japan/one.jpg', 'Japan/two.jpg', 'first-photo-bytes', 'second-photo-bytes']) expect(text).toContain(part);
    expect(progress.at(-1)).toEqual({ done: 2, bytes: 'first-photo-bytes'.length + 'second-photo-bytes'.length });
    expect(relistPage).not.toHaveBeenCalled();
  });

  it('lists a page again for fresh links after a failure, and leaves out a file that still fails', async () => {
    const fetch = answering({ 'https://b/fresh-1': 'one', 'https://b/2': new TypeError('network') });
    vi.stubGlobal('fetch', fetch);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    relistPage.mockResolvedValue(new Map([[1, { url: 'https://b/fresh-1' }], [2, { url: 'https://b/2' }]]));
    const files = [file(1, 'one.jpg', 'https://b/expired-1'), file(2, 'two.jpg', 'https://b/2')];
    const result = await saveZip({ files, fileName: 'x.zip', scope: { mapId: 'm' }, pages: pages() });

    expect(result).toEqual({ failed: ['two.jpg'] });
    expect(files[0].url).toBe('https://b/fresh-1');
    expect(fetch.mock.calls.map(([url]) => url).sort()).toEqual(['https://b/2', 'https://b/2', 'https://b/expired-1', 'https://b/fresh-1']);
    const text = await textOf(saved);
    expect(text).toContain('one.jpg');
    expect(text).not.toContain('two.jpg');
  });

  it('lists a page again first when its links may have run out', async () => {
    const fetch = answering({ 'https://b/new': 'bytes' });
    vi.stubGlobal('fetch', fetch);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    relistPage.mockResolvedValueOnce(new Map([[1, { url: 'https://b/new' }]])).mockResolvedValueOnce(new Map());
    const stale = [{ cursor: undefined, listedAt: Date.now() - LINK_FRESH_MS - 1 }];
    const result = await saveZip({ files: [file(1, 'a.jpg', 'https://b/old'), file(2, 'b.jpg', 'https://b/old2')], fileName: 'x.zip', scope: {}, pages: stale });

    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['https://b/new']);
    // The second file's page was listed again too, and it was no longer there
    expect(result.failed).toEqual(['b.jpg']);
  });

  it('streams the zip straight into a file the person chose', async () => {
    vi.stubGlobal('fetch', answering({ 'https://b/1': 'streamed-bytes' }));
    const chunks = [];
    const writable = new WritableStream({ write: (chunk) => chunks.push(chunk) });
    const result = await saveZip({ files: [file(1, 'one.jpg', 'https://b/1')], fileName: 'x.zip', writable, scope: {}, pages: pages() });

    expect(result).toEqual({ failed: [] });
    expect(saved).toBeNull();
    const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('latin1');
    expect(text).toContain('one.jpg');
    expect(text).toContain('streamed-bytes');
  });

  it('stops when the download is stopped, saving nothing', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        controller.abort();
        return new Response('x');
      }),
    );
    await expect(saveZip({ files: [file(1, 'a.jpg', 'https://b/1')], fileName: 'x.zip', scope: {}, pages: pages(), signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(saved).toBeNull();
  });
});
