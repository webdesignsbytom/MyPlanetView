import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installUploadInterceptor } from '@/dev/mock/mockXhr';
import { presignMockUpload } from '@/dev/mock/uploads';
import { createMockStreamUpload } from '@/dev/mock/stream';
import { session } from '@/dev/mock/store';
import { freshStore, stubObjectUrls } from './mockApi';

vi.mock('@/dev/mock/videoThumbnail', () => ({ makeMockThumbnails: vi.fn(async () => null) }));

const RealXHR = window.XMLHttpRequest;
beforeEach(() => {
  freshStore();
  stubObjectUrls();
  installUploadInterceptor();
});
afterEach(() => {
  window.XMLHttpRequest = RealXHR;
});

/** Sends `body` and resolves with the finished request. */
function send(xhr, body) {
  return new Promise((resolve) => {
    xhr.onload = () => resolve(xhr);
    xhr.send(body);
  });
}

describe('the upload interceptor', () => {
  const key = 'myplanetview/photos/map-home/p1/display-x.webp';

  it('keeps a PUT to the mock bucket that matches its signature, with its progress', async () => {
    const url = presignMockUpload(key, { resource: 'photo', contentType: 'image/webp', bytes: 4 });
    const xhr = new window.XMLHttpRequest();
    const progress = vi.fn();
    xhr.upload.onprogress = progress;
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', 'image/webp');
    const done = await send(xhr, new Blob(['abcd']));
    expect(done.status).toBe(200);
    expect(done.readyState).toBe(4);
    expect(done.responseText).toBe('');
    expect(progress).toHaveBeenCalledWith({ lengthComputable: true, loaded: 4, total: 4 });
    expect(session.blobs.has(key)).toBe(true);
  });

  it('answers 403 to a PUT whose type or size differs from the signed one', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const url = presignMockUpload(key, { resource: 'photo', contentType: 'image/webp', bytes: 4 });
    const wrongType = new window.XMLHttpRequest();
    wrongType.open('PUT', url);
    wrongType.setRequestHeader('Content-Type', 'image/jpeg');
    expect((await send(wrongType, new Blob(['abcd']))).status).toBe(403);
    const wrongSize = new window.XMLHttpRequest();
    wrongSize.open('PUT', url);
    wrongSize.setRequestHeader('Content-Type', 'image/webp');
    expect((await send(wrongSize, new Blob(['abcdef']))).status).toBe(403);
    expect(session.blobs.has(key)).toBe(false);
  });

  it('answers tus requests to the mock Stream, with their headers', async () => {
    const { uploadUrl } = createMockStreamUpload({ bytes: 9 });
    const xhr = new window.XMLHttpRequest();
    xhr.open('HEAD', uploadUrl);
    const done = await send(xhr);
    expect(done.status).toBe(200);
    expect(done.getResponseHeader('upload-offset')).toBe('0');
    expect(done.getResponseHeader('UPLOAD-LENGTH')).toBe('9');
    expect(done.getResponseHeader('nope')).toBeNull();
  });

  it('leaves every other request to the real XHR', () => {
    const xhr = new window.XMLHttpRequest();
    xhr.open('GET', 'http://localhost/api/anything');
    expect(xhr.mockKind).toBeNull();
    expect(xhr.readyState).toBe(1);
    xhr.setRequestHeader('X-Test', '1');
    expect(xhr.mockHeaders).toEqual({});
  });
});
