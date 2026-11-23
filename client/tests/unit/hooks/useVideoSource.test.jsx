import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useVideoSource, { isHlsUrl } from '@/hooks/useVideoSource';

// hls.js's light build, as far as the hook uses it
const hls = vi.hoisted(() => ({ supported: true, instances: [] }));
vi.mock('hls.js/light', () => {
  class FakeHls {
    static isSupported = () => hls.supported;
    static Events = { ERROR: 'hlsError' };
    static ErrorTypes = { MEDIA_ERROR: 'mediaError', NETWORK_ERROR: 'networkError' };
    constructor(config) {
      this.config = config;
      this.handlers = {};
      this.loadSource = vi.fn();
      this.attachMedia = vi.fn();
      this.destroy = vi.fn();
      this.recoverMediaError = vi.fn();
      hls.instances.push(this);
    }
    on(event, fn) {
      this.handlers[event] = fn;
    }
    fail(data) {
      this.handlers.hlsError?.('hlsError', data);
    }
  }
  return { default: FakeHls };
});

const PLAYLIST = 'https://customer.cloudflarestream.com/abc/manifest/video.m3u8?token=t';
let video;

beforeEach(() => {
  hls.supported = true;
  hls.instances = [];
  video = document.createElement('video');
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
});

const attach = (url, onFail = vi.fn()) => ({ onFail, ...renderHook(({ u }) => useVideoSource({ current: video }, u, onFail), { initialProps: { u: url } }) });

describe('isHlsUrl', () => {
  it.each([
    [PLAYLIST, true],
    ['https://x.example/v.M3U8', true],
    ['https://x.example/v.m3u8#t=3', true],
    ['blob:http://localhost/v.mp4', false],
    ['https://x.example/v.m3u8x', false],
    [null, false],
  ])('%s → %s', (url, expected) => {
    expect(isHlsUrl(url)).toBe(expected);
  });
});

describe('useVideoSource', () => {
  it('plays a plain file as it is', () => {
    attach('blob:http://localhost/v.mp4');
    expect(video.getAttribute('src')).toBe('blob:http://localhost/v.mp4');
    expect(video.dataset.playback).toBe('native');
  });

  it('lets a browser with its own HLS play the playlist (Safari)', () => {
    HTMLMediaElement.prototype.canPlayType.mockReturnValue('maybe');
    attach(PLAYLIST);
    expect(video.getAttribute('src')).toBe(PLAYLIST);
    expect(video.dataset.playback).toBe('native');
    expect(hls.instances).toHaveLength(0);
  });

  it('feeds the playlist through hls.js elsewhere', async () => {
    attach(PLAYLIST);
    await waitFor(() => expect(hls.instances).toHaveLength(1));
    const [player] = hls.instances;
    expect(player.config).toEqual({ capLevelToPlayerSize: true });
    expect(player.loadSource).toHaveBeenCalledWith(PLAYLIST);
    expect(player.attachMedia).toHaveBeenCalledWith(video);
    expect(video.dataset.playback).toBe('hls');
  });

  it('says it can’t play where hls.js isn’t supported', async () => {
    hls.supported = false;
    const { onFail } = attach(PLAYLIST);
    await waitFor(() => expect(onFail).toHaveBeenCalledTimes(1));
    expect(hls.instances).toHaveLength(0);
  });

  it('recovers from one decoding hiccup, then gives up', async () => {
    const { onFail } = attach(PLAYLIST);
    await waitFor(() => expect(hls.instances).toHaveLength(1));
    const [player] = hls.instances;
    player.fail({ fatal: false, type: 'networkError' });
    player.fail({ fatal: true, type: 'mediaError' });
    expect(player.recoverMediaError).toHaveBeenCalledTimes(1);
    expect(onFail).not.toHaveBeenCalled();
    player.fail({ fatal: true, type: 'mediaError' });
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  it('gives up at once on a fatal network error', async () => {
    const { onFail } = attach(PLAYLIST);
    await waitFor(() => expect(hls.instances).toHaveLength(1));
    hls.instances[0].fail({ fatal: true, type: 'networkError' });
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  it('lets go of everything when the link changes or the player goes', async () => {
    const { rerender, unmount } = attach(PLAYLIST);
    await waitFor(() => expect(hls.instances).toHaveLength(1));
    rerender({ u: 'blob:http://localhost/other.mp4' });
    expect(hls.instances[0].destroy).toHaveBeenCalled();
    expect(video.dataset.playback).toBe('native');
    unmount();
    expect(video.hasAttribute('src')).toBe(false);
    expect(video.dataset.playback).toBeUndefined();
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
  });

  it('does nothing without a link', () => {
    attach(null);
    expect(video.hasAttribute('src')).toBe(false);
    expect(video.dataset.playback).toBeUndefined();
  });
});
