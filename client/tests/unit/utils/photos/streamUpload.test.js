import { beforeEach, describe, expect, it, vi } from 'vitest';

// tus-js-client's Upload, standing in: it keeps its options and starts as the test says
const uploads = [];
vi.mock('tus-js-client', () => ({
  Upload: class {
    constructor(file, options) {
      this.file = file;
      this.options = options;
      this.start = vi.fn(() => this.onStart?.(this));
      uploads.push(this);
    }
  },
}));

import { STREAM_CHUNK_BYTES, STREAM_UPLOAD_FAILED, sendToStream } from '@/utils/photos/streamUpload';

beforeEach(() => {
  uploads.length = 0;
});

const nextUpload = async () => {
  await vi.waitFor(() => expect(uploads).toHaveLength(1));
  return uploads[0];
};

describe('sendToStream', () => {
  it('sends the file to the upload address in 50 MB pieces, reporting progress', async () => {
    const blob = new Blob(['video']);
    const onProgress = vi.fn();
    const done = sendToStream(blob, 'https://upload.example/tus/abc', { onProgress });
    const upload = await nextUpload();
    expect(upload.file).toBe(blob);
    expect(upload.options).toMatchObject({
      uploadUrl: 'https://upload.example/tus/abc',
      chunkSize: STREAM_CHUNK_BYTES,
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: true,
    });
    expect(STREAM_CHUNK_BYTES).toBe(50 * 1024 * 1024);
    expect(upload.options.retryDelays[0]).toBe(0);
    expect(upload.start).toHaveBeenCalled();
    upload.options.onProgress(25, 100);
    upload.options.onProgress(0, 0);
    upload.options.onSuccess();
    await expect(done).resolves.toBeUndefined();
    expect(onProgress.mock.calls).toEqual([
      [0.25, { sent: 25, total: 100 }],
      [0, { sent: 0, total: 0 }],
    ]);
  });

  it('rejects with words people can read when the upload fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const done = sendToStream(new Blob(['v']), 'https://upload.example/tus/abc');
    const upload = await nextUpload();
    upload.options.onError(new Error('tus: unexpected response 500'));
    await expect(done).rejects.toThrow(STREAM_UPLOAD_FAILED);
    expect(warn).toHaveBeenCalledWith('[video upload]', 'tus: unexpected response 500');
  });
});
