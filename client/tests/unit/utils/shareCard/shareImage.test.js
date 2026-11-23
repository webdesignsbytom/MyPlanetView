import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareImages, downloadImage, shareImage } from '@/utils/shareCard/shareImage';

const setNavigator = (name, value) => Object.defineProperty(navigator, name, { value, configurable: true });
afterEach(() => {
  delete navigator.canShare;
  delete navigator.share;
  vi.useRealTimers();
});

describe('canShareImages', () => {
  it('is false where the browser can’t share files', () => {
    expect(canShareImages()).toBe(false);
  });

  it('asks the browser about an image file', () => {
    const canShare = vi.fn(({ files }) => files[0] instanceof File && files[0].type === 'image/png');
    setNavigator('canShare', canShare);
    expect(canShareImages()).toBe(true);
    canShare.mockReturnValue(false);
    expect(canShareImages()).toBe(false);
    canShare.mockImplementation(() => {
      throw new TypeError('nope');
    });
    expect(canShareImages()).toBe(false);
  });
});

describe('shareImage', () => {
  it('opens the share sheet with the picture as a file', async () => {
    const share = vi.fn().mockResolvedValue();
    setNavigator('share', share);
    const blob = new Blob(['png'], { type: 'image/png' });
    expect(await shareImage(blob, { fileName: 'map.png', title: 'My map', text: 'Look' })).toBe(true);
    const [{ files, title, text }] = share.mock.calls[0];
    expect(files[0].name).toBe('map.png');
    expect(files[0].type).toBe('image/png');
    expect({ title, text }).toEqual({ title: 'My map', text: 'Look' });
  });

  it('gives false when the sheet is closed, and throws any other failure', async () => {
    const share = vi.fn().mockRejectedValueOnce(new DOMException('closed', 'AbortError')).mockRejectedValueOnce(new DOMException('no', 'NotAllowedError'));
    setNavigator('share', share);
    const blob = new Blob(['png']);
    expect(await shareImage(blob, { fileName: 'a.png' })).toBe(false);
    await expect(shareImage(blob, { fileName: 'a.png' })).rejects.toMatchObject({ name: 'NotAllowedError' });
    expect(share.mock.calls[0][0].files[0].type).toBe('image/png');
  });
});

describe('downloadImage', () => {
  it('saves the picture as a file, then lets its link go', () => {
    vi.useFakeTimers();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:card');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.download).toBe('card.png');
      expect(this.getAttribute('href')).toBe('blob:card');
    });
    downloadImage(new Blob(['png']), 'card.png');
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a')).toBeNull();
    vi.advanceTimersByTime(2000);
    expect(revoke).toHaveBeenCalledWith('blob:card');
  });
});
