import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readVideoElementLength } from '@/utils/photos/videoElementLength';

// A <video> the test drives: its events, duration and seeking
let video;
class FakeVideo extends EventTarget {
  constructor() {
    super();
    this.duration = NaN;
    this.load = vi.fn();
    this.removeAttribute = vi.fn();
    this.seekTo = null;
  }
  set currentTime(value) {
    this.seekTo = value;
  }
  set src(value) {
    this.source = value;
  }
}

beforeEach(() => {
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag !== 'video') return createElement(tag);
    video = new FakeVideo();
    return video;
  });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:video');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

afterEach(() => vi.useRealTimers());

describe('readVideoElementLength', () => {
  it('reads the length once the browser has the metadata, then lets the file go', async () => {
    const done = readVideoElementLength(new Blob(['v']));
    expect(video.source).toBe('blob:video');
    expect(video.muted).toBe(true);
    expect(video.preload).toBe('metadata');
    video.duration = 41.5;
    video.dispatchEvent(new Event('loadedmetadata'));
    await expect(done).resolves.toBe(41.5);
    expect(video.removeAttribute).toHaveBeenCalledWith('src');
    expect(video.load).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:video');
  });

  it('seeks to the end of a recording whose length is endless at first', async () => {
    const done = readVideoElementLength(new Blob(['v']));
    video.duration = Infinity;
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(video.seekTo).toBe(Number.MAX_SAFE_INTEGER);
    video.dispatchEvent(new Event('durationchange'));
    video.duration = 12.25;
    video.dispatchEvent(new Event('seeked'));
    await expect(done).resolves.toBe(12.25);
  });

  it('gives null when the browser can’t play it, or says it lasts no time', async () => {
    const failed = readVideoElementLength(new Blob(['v']));
    video.dispatchEvent(new Event('error'));
    await expect(failed).resolves.toBeNull();

    const empty = readVideoElementLength(new Blob(['v']));
    video.duration = 0;
    video.dispatchEvent(new Event('loadedmetadata'));
    await expect(empty).resolves.toBeNull();
  });

  it('gives up after ten seconds', async () => {
    vi.useFakeTimers();
    const done = readVideoElementLength(new Blob(['v']));
    vi.advanceTimersByTime(10_000);
    await expect(done).resolves.toBeNull();
    // A late answer changes nothing
    video.duration = 5;
    video.dispatchEvent(new Event('loadedmetadata'));
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});
