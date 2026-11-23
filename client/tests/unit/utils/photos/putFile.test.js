import { beforeEach, describe, expect, it, vi } from 'vitest';
import { putFile, putFiles } from '@/utils/photos/putFile';

// A stand-in XMLHttpRequest: each request is kept, and answers when the test says
let requests;
class FakeXhr {
  constructor() {
    this.headers = {};
    this.upload = {};
    requests.push(this);
  }
  open(method, url) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name, value) {
    this.headers[name] = value;
  }
  send(body) {
    this.body = body;
    this.onSend?.(this);
  }
  answer(status) {
    this.status = status;
    this.onload();
  }
}

beforeEach(() => {
  requests = [];
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
});

const blobOf = (size, type = 'image/jpeg') => new Blob([new Uint8Array(size)], { type });

describe('putFile', () => {
  it('PUTs the blob with its declared type, reporting progress', async () => {
    const blob = blobOf(10);
    const onProgress = vi.fn();
    const done = putFile('https://bucket.example/put', blob, 'image/webp', onProgress, 10);
    const [xhr] = requests;
    expect(xhr.method).toBe('PUT');
    expect(xhr.url).toBe('https://bucket.example/put');
    expect(xhr.headers).toEqual({ 'Content-Type': 'image/webp' });
    expect(xhr.body).toBe(blob);
    xhr.upload.onprogress({ lengthComputable: true, loaded: 4 });
    xhr.upload.onprogress({ lengthComputable: false, loaded: 7 });
    xhr.answer(200);
    await expect(done).resolves.toBeUndefined();
    expect(onProgress.mock.calls).toEqual([[4]]);
  });

  it('refuses a blob that isn’t the size the presign declared, sending nothing', async () => {
    await expect(putFile('https://bucket.example/put', blobOf(9), 'image/jpeg', null, 10)).rejects.toThrow(
      'The file changed before it could be uploaded. Please choose it again.',
    );
    expect(requests).toHaveLength(0);
  });

  it('says when the bucket refuses it', async () => {
    const done = putFile('https://bucket.example/put', blobOf(3), 'image/jpeg');
    requests[0].answer(403);
    await expect(done).rejects.toThrow('The upload was refused (403).');
  });

  it('says when the connection fails', async () => {
    const done = putFile('https://bucket.example/put', blobOf(3), 'image/jpeg');
    requests[0].onerror();
    await expect(done).rejects.toThrow('The upload failed. Check your connection and try again.');
  });
});

describe('putFiles', () => {
  const files = [
    { size: 'THUMB', blob: blobOf(10), contentType: 'image/webp', bytes: 10 },
    { size: 'DISPLAY', blob: blobOf(30), contentType: 'image/webp', bytes: 30 },
  ];
  const uploads = [
    { size: 'DISPLAY', url: 'https://bucket.example/display', key: 'k/display' },
    { size: 'THUMB', url: 'https://bucket.example/thumb', key: 'k/thumb' },
  ];

  it('sends each file to its own address in turn, reporting the whole upload’s progress', async () => {
    const onProgress = vi.fn();
    const answerEach = (xhr) => {
      xhr.upload.onprogress({ lengthComputable: true, loaded: xhr.body.size / 2 });
      queueMicrotask(() => xhr.answer(200));
    };
    FakeXhr.prototype.onSend = answerEach;
    try {
      const keys = await putFiles(files, uploads, onProgress);
      expect(keys).toEqual({ THUMB: 'k/thumb', DISPLAY: 'k/display' });
    } finally {
      delete FakeXhr.prototype.onSend;
    }
    expect(requests.map((r) => r.url)).toEqual(['https://bucket.example/thumb', 'https://bucket.example/display']);
    expect(onProgress.mock.calls.map(([fraction, bytes]) => [fraction, bytes.sent])).toEqual([
      [5 / 40, 5],
      [10 / 40, 10],
      [25 / 40, 25],
      [1, 40],
    ]);
    expect(onProgress.mock.calls[0][1].total).toBe(40);
  });

  it('refuses a file the server gave no address for', async () => {
    await expect(putFiles([files[0]], [uploads[0]])).rejects.toThrow('The server didn’t give an upload address for this file.');
  });
});
