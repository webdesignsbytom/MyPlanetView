import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeMockThumbnails } from '@/dev/mock/videoThumbnail';
import { encode } from '@/utils/photos/makePhotoCopies';
import { stubObjectUrls } from './mockApi';

vi.mock('@/utils/photos/makePhotoCopies', () => ({ encode: vi.fn(async (canvas, width) => ({ blob: new Blob([`jpeg-${width}`]) })) }));

// jsdom plays no video: the test fires its events, and the canvas is a recording fake
let video;
let alpha;
beforeEach(() => {
  stubObjectUrls();
  alpha = 255;
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  const create = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = create(tag);
    if (tag === 'video') video = el;
    return el;
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
    drawImage: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(16 * 16 * 4).fill(alpha) }),
  }));
});

const withPicture = (width, height, duration = 10) => {
  Object.defineProperty(video, 'videoWidth', { value: width });
  Object.defineProperty(video, 'videoHeight', { value: height });
  Object.defineProperty(video, 'duration', { value: duration });
  Object.defineProperty(video, 'currentTime', { value: 0, writable: true });
};

describe('makeMockThumbnails', () => {
  it('draws a frame about a second in, at 400 and 1,080 px', async () => {
    const result = makeMockThumbnails(new Blob(['video']));
    withPicture(1920, 1080);
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(video.currentTime).toBe(1);
    video.dispatchEvent(new Event('seeked'));
    expect(await result).toEqual({ thumb: 'blob:mock/2', display: 'blob:mock/3', width: 1920, height: 1080 });
    expect(encode.mock.calls.map((call) => call.slice(1))).toEqual([
      [400, 0.75],
      [1080, 0.82],
    ]);
  });

  it('takes the middle of a video shorter than two seconds', async () => {
    const result = makeMockThumbnails(new Blob(['video']));
    withPicture(640, 480, 1.2);
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(video.currentTime).toBeCloseTo(0.6);
    video.dispatchEvent(new Event('seeked'));
    expect((await result).width).toBe(640);
  });

  it('has none when the browser can’t decode the video', async () => {
    const result = makeMockThumbnails(new Blob(['video']));
    video.dispatchEvent(new Event('error'));
    expect(await result).toBeNull();
  });

  it('has none for a video with no picture', async () => {
    const result = makeMockThumbnails(new Blob(['video']));
    withPicture(0, 0);
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(await result).toBeNull();
  });

  it('has none when the frame drawn is see-through (nothing decoded)', async () => {
    alpha = 0;
    const result = makeMockThumbnails(new Blob(['video']));
    withPicture(320, 240);
    video.dispatchEvent(new Event('loadedmetadata'));
    video.dispatchEvent(new Event('seeked'));
    expect(await result).toBeNull();
  });

  it('gives up after ten seconds with no frame', async () => {
    vi.useFakeTimers();
    try {
      const result = makeMockThumbnails(new Blob(['video']));
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await result).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
