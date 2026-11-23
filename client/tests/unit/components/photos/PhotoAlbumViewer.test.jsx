import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PhotoAlbumViewer from '@/components/photos/PhotoAlbumViewer';
import VideoPlayer from '@/components/photos/VideoPlayer';
import useVideoSource from '@/hooks/useVideoSource';

vi.mock('@/hooks/useVideoSource', () => ({
  default: vi.fn(),
  isHlsUrl: (url) => /\.m3u8(?:[?#]|$)/i.test(String(url || '')),
}));

// jsdom has no PointerEvent, so fireEvent would send a plain Event without the position
class FakePointerEvent extends MouseEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? '';
  }
}

const album = [
  { id: 'a', caption: 'Sunrise over Angkor', displayUrl: '/d/a.jpg' },
  { id: 'b', countryCode: 'FR', displayUrl: '/d/b.jpg' },
  { id: 'c', displayUrl: '/d/c.jpg' },
];

describe('PhotoAlbumViewer', () => {
  beforeEach(() => vi.stubGlobal('PointerEvent', FakePointerEvent));

  const open = (props = {}) => {
    const onIndex = vi.fn();
    const onClose = vi.fn();
    render(<PhotoAlbumViewer photos={album} index={1} onIndex={onIndex} onClose={onClose} {...props} />);
    return { onIndex, onClose, dialog: document.querySelector('[role="dialog"]') };
  };

  it('is a full-screen dialog titled with the caption, else the country, else “Photo”', () => {
    const { dialog } = open({ index: 0 });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Sunrise over Angkor');
    expect(screen.getByAltText('Sunrise over Angkor').getAttribute('src')).toBe('/d/a.jpg');
  });

  it('names a photo with no caption by its country, and one with neither “Photo”', () => {
    const { dialog } = open();
    expect(dialog.querySelector('h2').textContent).toBe('France');
    expect(screen.getByText('Photo 2 of 3: France').getAttribute('role')).toBe('status');
  });

  it('steps with the stamps under the photo, switched off at the ends', () => {
    const { onIndex } = open({ index: 0 });
    expect(screen.getByLabelText('Previous photo').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Next photo'));
    expect(onIndex).toHaveBeenCalledWith(1);
  });

  it('steps with the arrow keys anywhere but in a video’s controls', () => {
    const { onIndex } = open();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onIndex).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(onIndex).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(document, { key: 'ArrowRight', ctrlKey: true });
    expect(onIndex).toHaveBeenCalledTimes(2);
  });

  it('steps with a sideways swipe, not a mouse drag', () => {
    const { onIndex, dialog } = open();
    const stage = dialog.querySelector('img').parentElement;
    fireEvent.pointerDown(stage, { pointerType: 'mouse', clientX: 300, clientY: 100 });
    fireEvent.pointerUp(stage, { pointerType: 'mouse', clientX: 100, clientY: 100 });
    expect(onIndex).not.toHaveBeenCalled();
    fireEvent.pointerDown(stage, { pointerType: 'touch', clientX: 100, clientY: 100 });
    fireEvent.pointerUp(stage, { pointerType: 'touch', clientX: 300, clientY: 110 });
    expect(onIndex).toHaveBeenCalledWith(0);
  });

  it('loads the next page as the end comes near', () => {
    const onLoadMore = vi.fn();
    open({ index: 1, hasMore: true, onLoadMore });
    expect(onLoadMore).toHaveBeenCalled();
    expect(screen.getByText('Photo 2 of 3 or more: France')).toBeTruthy();
  });

  it('closes with its close stamp and with Escape', () => {
    const { onClose } = open();
    fireEvent.click(screen.getByLabelText('Close the photo'));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document.querySelector('[role="dialog"]'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('plays a ready video, and shows a still for one with no link yet', () => {
    const photos = [
      { id: 'v', kind: 'VIDEO', videoState: 'READY', videoUrl: '/v.m3u8', durationS: 30, displayUrl: '/v.jpg' },
      { id: 'w', kind: 'VIDEO', videoState: 'PROCESSING', thumbUrl: '/w.jpg', caption: 'Coming' },
    ];
    const { rerender } = render(<PhotoAlbumViewer photos={photos} index={0} onIndex={() => {}} onClose={() => {}} />);
    expect(document.querySelector('video').getAttribute('aria-label')).toBe('Video, 30 seconds');
    rerender(<PhotoAlbumViewer photos={photos} index={1} onIndex={() => {}} onClose={() => {}} />);
    expect(screen.getByAltText('Coming').getAttribute('src')).toBe('/w.jpg');
  });
});

describe('VideoPlayer', () => {
  it('says a video is being prepared, with “Check now”', () => {
    const onRefresh = vi.fn();
    render(<VideoPlayer photo={{ id: 'v', kind: 'VIDEO', videoState: 'PROCESSING' }} onRefresh={onRefresh} />);
    expect(screen.getByText('Getting this video ready')).toBeTruthy();
    fireEvent.click(screen.getByText('Check now'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('says a failed video couldn’t be prepared, with nothing to check', () => {
    render(<VideoPlayer photo={{ id: 'v', kind: 'VIDEO', videoState: 'FAILED' }} onRefresh={() => {}} />);
    expect(screen.getByText('This video couldn’t be prepared')).toBeTruthy();
    expect(screen.queryByText('Check now')).toBeNull();
  });

  it('plays a ready one from its link, over its poster frame', () => {
    render(<VideoPlayer photo={{ id: 'v', videoState: 'READY', videoUrl: '/v.m3u8', displayUrl: '/p.jpg', durationS: 90 }} />);
    const video = document.querySelector('video');
    expect(video.getAttribute('poster')).toBe('/p.jpg');
    expect(video.getAttribute('aria-label')).toBe('Video, 1 minute 30 seconds');
    expect(useVideoSource.mock.lastCall[1]).toBe('/v.m3u8');
  });

  it('offers a plain file to download when this browser can’t play it', () => {
    render(<VideoPlayer photo={{ id: 'v', videoState: 'READY', videoUrl: '/v.mp4' }} />);
    fireEvent.error(document.querySelector('video'));
    expect(screen.getByText('This browser can’t play this video.')).toBeTruthy();
    expect(screen.getByText('Download to watch').closest('a').getAttribute('href')).toBe('/v.mp4');
    expect(useVideoSource.mock.lastCall[1]).toBeNull();
  });

  it('suggests another browser for a stream it can’t play', () => {
    render(<VideoPlayer photo={{ id: 'v', videoState: 'READY', videoUrl: '/v.m3u8' }} />);
    // useVideoSource's own failure
    const fail = useVideoSource.mock.lastCall[2];
    act(() => fail());
    expect(screen.getByText('Try it in another browser, or on another device.')).toBeTruthy();
    expect(screen.queryByText('Download to watch')).toBeNull();
  });
});
