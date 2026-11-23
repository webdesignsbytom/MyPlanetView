import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Slideshow from '@/components/slideshow/Slideshow';
import useSlideshowPhotos from '@/hooks/useSlideshowPhotos';
import useSlideshowMoments from '@/hooks/useSlideshowMoments';
import useWakeLock from '@/hooks/useWakeLock';

vi.mock('@/hooks/useSlideshowPhotos', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useSlideshowMoments', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useWakeLock', () => ({ default: vi.fn() }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ default: () => true }));
vi.mock('@/components/slideshow/SlideshowOffer', () => ({ default: ({ every }) => <div data-slideshow-offer={every} /> }));

// jsdom has no PointerEvent, so fireEvent would send a plain Event without the position
class FakePointerEvent extends MouseEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? '';
  }
}

const PHOTOS = [
  { id: 'p1', countryCode: 'FR', takenAt: '2024-05-01T10:00:00Z', displayUrl: '/1.jpg', caption: 'Paris' },
  { id: 'p2', countryCode: 'FR', takenAt: '2024-05-02T10:00:00Z', displayUrl: '/2.jpg' },
  { id: 'p3', countryCode: 'IT', takenAt: '2024-06-01T10:00:00Z', displayUrl: '/3.jpg' },
];

const listOf = (photos, extra = {}) => ({
  photos,
  complete: true,
  loading: false,
  error: null,
  nextCursor: null,
  loadMore: vi.fn(),
  stale: false,
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('PointerEvent', FakePointerEvent);
  useSlideshowPhotos.mockReturnValue(listOf(PHOTOS));
  useSlideshowMoments.mockReturnValue({ ready: true, moments: [] });
});
afterEach(() => vi.useRealTimers());

const stage = () => document.querySelector('[data-slide-kind]');
const kind = () => stage().getAttribute('data-slide-kind');
const slideId = () => stage().getAttribute('data-slide-id');

const open = (props = {}) => {
  const onClose = vi.fn();
  render(<Slideshow source={{ mapId: 'm1' }} title='Play my world' onClose={onClose} {...props} />);
  return { onClose };
};

describe('Slideshow', () => {
  it('is a modal dialog with its title, opening on the first slide with focus on Pause', () => {
    open({ titleCards: true });
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Play my world')).toBeTruthy();
    expect(kind()).toBe('card');
    expect(slideId()).toBe('card-p1');
    expect(document.activeElement.getAttribute('aria-label')).toBe('Pause');
    expect(useSlideshowPhotos.mock.calls[0][0]).toMatchObject({ mapId: 'm1', order: 'taken' });
  });

  it('puts a title card before each change of country in the worldwide show, then the end', () => {
    open({ titleCards: true });
    const seen = [];
    for (let i = 0; i < 6; i++) {
      seen.push(slideId());
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    }
    expect(seen).toEqual(['card-p1', 'p1', 'p2', 'card-p3', 'p3', 'end']);
    expect(screen.getByText('The end')).toBeTruthy();
  });

  it('puts the dated moments in as cards, and waits for them before its first slide', () => {
    useSlideshowMoments.mockReturnValue({ ready: false, moments: [] });
    const { rerender } = render(<Slideshow source={{ mapId: 'm1' }} title='Show' onClose={() => {}} />);
    expect(screen.getByText('Loading the photos…')).toBeTruthy();
    useSlideshowMoments.mockReturnValue({
      ready: true,
      moments: [{ id: 'm9', kind: 'WEDDING', title: 'Our wedding', happenedOn: '2024-05-02', datePrecision: 'DAY', countryCode: 'FR' }],
    });
    rerender(<Slideshow source={{ mapId: 'm1' }} title='Show' onClose={() => {}} />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(slideId()).toBe('moment-m9');
    expect(screen.getByLabelText('Moment: Our wedding')).toBeTruthy();
  });

  it('steps with the arrow keys and the stamps, Previous switched off at the start', () => {
    open();
    expect(screen.getByLabelText('Previous').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Next'));
    expect(slideId()).toBe('p2');
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(slideId()).toBe('p1');
    // Not while typing in a field, nor with a modifier
    fireEvent.keyDown(document, { key: 'ArrowRight', altKey: true });
    expect(slideId()).toBe('p1');
  });

  it('plays and pauses with Space, unless a button has focus', () => {
    open();
    act(() => document.body.focus());
    fireEvent.keyDown(document.body, { key: ' ' });
    // The group of stamps is called "Play" too
    expect(document.querySelector('button[aria-label="Play"]')).toBeTruthy();
    fireEvent.keyDown(document.body, { key: ' ' });
    expect(screen.getByLabelText('Pause')).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText('Next'), { key: ' ' });
    expect(screen.getByLabelText('Pause')).toBeTruthy();
  });

  it('keeps the screen awake only while it plays', () => {
    open();
    expect(useWakeLock).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByLabelText('Pause'));
    expect(useWakeLock).toHaveBeenLastCalledWith(false);
  });

  it('remembers the chosen speed in this browser', () => {
    open();
    expect(screen.getByLabelText('5 seconds a photo').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByLabelText('8 seconds a photo'));
    expect(localStorage.getItem('mpv:slideshowSpeed')).toBe('8');
    expect(screen.getByLabelText('8 seconds a photo').getAttribute('aria-pressed')).toBe('true');
  });

  it('starts from the speed remembered', () => {
    localStorage.setItem('mpv:slideshowSpeed', '3');
    open();
    expect(screen.getByLabelText('3 seconds a photo').getAttribute('aria-pressed')).toBe('true');
  });

  it('moves on by itself: a photo once loaded, for the chosen time; a title card for at most 3 s', () => {
    vi.useFakeTimers();
    open({ titleCards: true });
    expect(slideId()).toBe('card-p1');
    act(() => vi.advanceTimersByTime(2900));
    expect(slideId()).toBe('card-p1');
    act(() => vi.advanceTimersByTime(200));
    expect(slideId()).toBe('p1');
    // Its time starts once the picture has loaded
    act(() => vi.advanceTimersByTime(10000));
    expect(slideId()).toBe('p1');
    fireEvent.load(screen.getByAltText('Paris'));
    act(() => vi.advanceTimersByTime(4900));
    expect(slideId()).toBe('p1');
    act(() => vi.advanceTimersByTime(200));
    expect(slideId()).toBe('p2');
  });

  it('stops at the end card, with Play again and Shuffle and play', () => {
    open();
    for (let i = 0; i < 3; i++) fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(kind()).toBe('end');
    fireEvent.click(screen.getByText('Shuffle and play'));
    expect(slideId()).toBe('p1');
    expect(useSlideshowPhotos.mock.lastCall[0].order).toBe('shuffle');
  });

  it('turns Shuffle on and off, pressed while on', () => {
    open();
    fireEvent.click(screen.getByLabelText('Shuffle'));
    expect(useSlideshowPhotos.mock.lastCall[0].order).toBe('shuffle');
    expect(useSlideshowMoments.mock.lastCall[0].enabled).toBe(false);
    expect(screen.getByLabelText('Shuffle').getAttribute('aria-pressed')).toBe('true');
  });

  it('shows one offer on the end card only where the galleries show cards', () => {
    open({ adEvery: 12 });
    expect(document.querySelector('[data-slideshow-offer]')).toBeNull();
    for (let i = 0; i < 3; i++) fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(document.querySelector('[data-slideshow-offer]').getAttribute('data-slideshow-offer')).toBe('12');
  });

  it('says when there are no photos, and shows a failure', () => {
    useSlideshowPhotos.mockReturnValue(listOf([]));
    const { unmount } = render(<Slideshow source={{ tripId: 't1' }} title='Trip' onClose={() => {}} />);
    expect(screen.getByText('No photos to play yet.')).toBeTruthy();
    unmount();
    useSlideshowPhotos.mockReturnValue(listOf([], { complete: false, error: 'No connection.' }));
    render(<Slideshow source={{ tripId: 't1' }} title='Trip' onClose={() => {}} />);
    expect(screen.getByText('No connection.')).toBeTruthy();
  });

  it('starts again, saying why, when the photos changed as it played', () => {
    useSlideshowPhotos.mockReturnValue(listOf(PHOTOS, { stale: true }));
    open();
    expect(screen.getByText('The photos changed while the show played, so it started again.')).toBeTruthy();
  });

  it('fetches the next page before the end of this one', () => {
    const loadMore = vi.fn();
    useSlideshowPhotos.mockReturnValue(listOf(PHOTOS, { complete: false, nextCursor: 'c2', loadMore }));
    open();
    expect(loadMore).toHaveBeenCalled();
  });

  it('steps with a swipe', () => {
    open();
    fireEvent.pointerDown(stage(), { clientX: 300, clientY: 100 });
    fireEvent.pointerUp(stage(), { clientX: 100, clientY: 105 });
    expect(slideId()).toBe('p2');
    fireEvent.pointerDown(stage(), { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(stage(), { clientX: 300, clientY: 100 });
    expect(slideId()).toBe('p1');
  });

  it('closes with its stamp, Escape, or a press on the backdrop', () => {
    const { onClose } = open();
    fireEvent.click(screen.getByLabelText('Close the slideshow'));
    fireEvent.keyDown(document.querySelector('[role="dialog"]'), { key: 'Escape' });
    fireEvent.mouseDown(document.querySelector('[role="dialog"]').parentElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('reads what is on screen out when paused, counting the photos', () => {
    open();
    fireEvent.click(screen.getByLabelText('Pause'));
    const live = document.querySelector('[aria-live]');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('Photo 1 of 3. France. 1 May 2024. Paris');
  });

  it('offers full screen where the browser allows it', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const requestFullscreen = vi.fn(() => Promise.resolve());
    HTMLElement.prototype.requestFullscreen = requestFullscreen;
    try {
      open();
      fireEvent.click(screen.getByLabelText('Full screen'));
      expect(requestFullscreen).toHaveBeenCalled();
    } finally {
      delete document.fullscreenEnabled;
      delete HTMLElement.prototype.requestFullscreen;
    }
  });
});
