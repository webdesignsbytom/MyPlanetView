import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SlideCaption from '@/components/slideshow/SlideCaption';
import SlideMomentCard from '@/components/slideshow/SlideMomentCard';
import SlidePhoto from '@/components/slideshow/SlidePhoto';
import SlideTitleCard from '@/components/slideshow/SlideTitleCard';
import SlideVideo from '@/components/slideshow/SlideVideo';
import SlideshowControls from '@/components/slideshow/SlideshowControls';
import SlideshowOffer from '@/components/slideshow/SlideshowOffer';
import useVideoSource from '@/hooks/useVideoSource';
import useGalleryOffers from '@/hooks/useGalleryOffers';
import usePlannedTripPlace from '@/hooks/usePlannedTripPlace';

vi.mock('@/hooks/useVideoSource', () => ({ default: vi.fn(), isHlsUrl: () => true }));
vi.mock('@/hooks/useGalleryOffers', () => ({ default: vi.fn() }));
vi.mock('@/hooks/usePlannedTripPlace', () => ({ default: vi.fn() }));
vi.mock('@/components/offers/OfferBrochure', () => ({ default: ({ offer, href }) => <a data-brochure href={href}>{offer.title}</a> }));

beforeEach(() => vi.clearAllMocks());

describe('SlideCaption', () => {
  const caption = (slide, photoCount = 3, counter = '') => render(<p><SlideCaption slide={slide} photoCount={photoCount} counter={counter} /></p>).container.textContent;

  it('names a title card’s country, a moment’s title and how many photos there were', () => {
    expect(caption({ type: 'card', countryCode: 'IT' })).toBe('Italy');
    expect(caption({ type: 'moment', moment: { title: 'Engaged' } })).toBe('Engaged');
    expect(caption({ type: 'end' }, 1)).toBe('That’s all 1 photo.');
    expect(caption({ type: 'end' }, 16)).toBe('That’s all 16 photos.');
    expect(caption(null)).toBe('');
  });

  it('describes a photo: count, place and confirmed landmarks, day, hidden, caption', () => {
    const photo = {
      countryCode: 'FR',
      landmarks: [{ name: 'Eiffel Tower', confirmed: true }, { name: 'Louvre', confirmed: false }],
      takenAt: '2024-05-01T10:00:00Z',
      hidden: true,
      caption: 'At dusk',
    };
    expect(caption({ type: 'photo', photo }, 16, 'Photo 3 of 16')).toBe('Photo 3 of 16. France · Eiffel Tower. 1 May 2024. Hidden from viewers. At dusk');
    expect(caption({ type: 'photo', photo: {} })).toBe('Somewhere unplaced');
  });
});

describe('SlideMomentCard', () => {
  it('shows the kind, the date, the title, where and the story', () => {
    render(
      <SlideMomentCard
        moment={{ kind: 'WEDDING', title: 'Our wedding', happenedOn: '2019-06-01', datePrecision: 'MONTH', placeName: 'Lake Como', countryCode: 'IT', text: 'Sunny.' }}
      />,
    );
    expect(screen.getByLabelText('Moment: Our wedding')).toBeTruthy();
    expect(screen.getByText('Wedding · June 2019')).toBeTruthy();
    expect(screen.getByText('Lake Como, Italy')).toBeTruthy();
    expect(screen.getByText('Sunny.')).toBeTruthy();
  });

  it('names its landmark before the country', () => {
    render(<SlideMomentCard moment={{ kind: 'NOTE', title: 'Up the tower', landmark: { name: 'Eiffel Tower' }, countryCode: 'FR' }} />);
    expect(screen.getByText('Eiffel Tower, France')).toBeTruthy();
  });
});

describe('SlideTitleCard', () => {
  it('says “First stop” on the first card and “Next stop” after, with the country’s poster', () => {
    const { rerender } = render(<SlideTitleCard countryCode='FR' first />);
    expect(screen.getByText('First stop')).toBeTruthy();
    expect(screen.getByText('France')).toBeTruthy();
    expect(screen.getByAltText('Travel poster for France')).toBeTruthy();
    rerender(<SlideTitleCard countryCode='FR' />);
    expect(screen.getByText('Next stop')).toBeTruthy();
  });
});

describe('SlidePhoto', () => {
  it('is ready once loaded, or once it fails', () => {
    const onReady = vi.fn();
    render(<SlidePhoto photo={{ id: 'p1', displayUrl: '/d.jpg', thumbUrl: '/t.jpg' }} alt='Paris' reducedMotion={false} onReady={onReady} />);
    const img = screen.getByAltText('Paris');
    expect(img.getAttribute('src')).toBe('/d.jpg');
    expect(img.className).toContain('opacity-0');
    fireEvent.load(img);
    expect(onReady).toHaveBeenCalledWith('p1');
    expect(img.className).toContain('scale-[1.04]');
  });

  it('cuts with no fade or zoom under reduced motion', () => {
    const onReady = vi.fn();
    render(<SlidePhoto photo={{ id: 'p1', thumbUrl: '/t.jpg' }} alt='Paris' reducedMotion onReady={onReady} />);
    const img = screen.getByAltText('Paris');
    expect(img.getAttribute('src')).toBe('/t.jpg');
    expect(img.className).toContain('opacity-100');
    expect(img.getAttribute('style')).toBeNull();
    fireEvent.error(img);
    expect(onReady).toHaveBeenCalledWith('p1');
  });
});

describe('SlideVideo', () => {
  let play;
  let pause;
  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  const video = (props = {}) => {
    const handlers = { onReady: vi.fn(), onEnded: vi.fn(), onFailed: vi.fn(), onMutedChange: vi.fn() };
    const photo = { id: 'v1', kind: 'VIDEO', videoUrl: '/v.m3u8', displayUrl: '/v.jpg' };
    const utils = render(<SlideVideo photo={photo} alt='Over the Nile' playing muted reducedMotion={false} {...handlers} {...props} />);
    return { ...handlers, ...utils, photo };
  };

  it('plays muted with the show, from its stream link', () => {
    video();
    const el = screen.getByLabelText('Over the Nile');
    expect(el.tagName).toBe('VIDEO');
    expect(el.muted).toBe(true);
    expect(play).toHaveBeenCalled();
    expect(useVideoSource.mock.lastCall[1]).toBe('/v.m3u8');
  });

  it('pauses with the show', () => {
    const { rerender, photo, ...handlers } = video();
    rerender(<SlideVideo photo={photo} alt='Over the Nile' playing={false} muted reducedMotion={false} {...handlers} />);
    expect(pause).toHaveBeenCalled();
  });

  it('turns the sound on and off with its button', () => {
    const { onMutedChange } = video();
    fireEvent.click(screen.getByLabelText('Turn the sound on'));
    expect(onMutedChange).toHaveBeenCalledWith(false);
  });

  it('is ready once its data has loaded, and moves the show on when it ends', () => {
    const { onReady, onEnded } = video();
    const el = screen.getByLabelText('Over the Nile');
    fireEvent.loadedData(el);
    expect(onReady).toHaveBeenCalledWith('v1');
    fireEvent.ended(el);
    expect(onEnded).toHaveBeenCalledWith('v1');
  });

  it('shows its poster frame as a photo when it can’t play', () => {
    const { onFailed } = video();
    fireEvent.error(screen.getByLabelText('Over the Nile'));
    expect(onFailed).toHaveBeenCalledWith('v1');
    expect(screen.getByAltText('Over the Nile').tagName).toBe('IMG');
    expect(screen.queryByLabelText('Turn the sound on')).toBeNull();
  });

  it('turns the sound off again when the browser refuses it', async () => {
    play.mockImplementationOnce(() => Promise.reject(Object.assign(new Error('no'), { name: 'NotAllowedError' })));
    const { onMutedChange } = video({ muted: false });
    await act(async () => {});
    expect(onMutedChange).toHaveBeenCalledWith(true);
  });
});

describe('SlideshowControls', () => {
  const controls = (props = {}) => {
    const handlers = { onPlayPause: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn(), onShuffle: vi.fn(), onSpeed: vi.fn(), onFullscreen: vi.fn() };
    render(<SlideshowControls playing canPrevious canNext shuffle={false} speed={5} fullscreen={false} canFullscreen {...handlers} {...props} />);
    return handlers;
  };

  it('calls each control, and the speed tags', () => {
    const h = controls();
    fireEvent.click(screen.getByLabelText('Previous'));
    fireEvent.click(screen.getByLabelText('Next'));
    fireEvent.click(document.querySelector('button[aria-label="Pause"]'));
    fireEvent.click(screen.getByLabelText('Shuffle'));
    fireEvent.click(screen.getByLabelText('Full screen'));
    fireEvent.click(screen.getByLabelText('3 seconds a photo'));
    expect(h.onPrevious).toHaveBeenCalled();
    expect(h.onNext).toHaveBeenCalled();
    expect(h.onPlayPause).toHaveBeenCalled();
    expect(h.onShuffle).toHaveBeenCalled();
    expect(h.onFullscreen).toHaveBeenCalled();
    expect(h.onSpeed).toHaveBeenCalledWith(3);
  });

  it('says Leave full screen while in it, and has no full screen where the browser can’t', () => {
    const { unmount } = render(
      <SlideshowControls playing={false} canPrevious={false} canNext={false} speed={8} fullscreen canFullscreen onFullscreen={() => {}} />,
    );
    expect(screen.getByLabelText('Leave full screen')).toBeTruthy();
    expect(document.querySelector('button[aria-label="Play"]')).toBeTruthy();
    expect(screen.getByLabelText('Next').disabled).toBe(true);
    unmount();
    render(<SlideshowControls playing speed={5} canFullscreen={false} />);
    expect(screen.queryByLabelText('Full screen')).toBeNull();
  });
});

describe('SlideshowOffer', () => {
  it('shows the slot’s one card, chosen from the show’s last photos, newest first', () => {
    const cardAt = vi.fn(() => ({ offer: { title: 'Hotels in Rome' }, href: '/go/1' }));
    useGalleryOffers.mockReturnValue({ every: 12, cardAt });
    usePlannedTripPlace.mockReturnValue({ countryCode: 'IT' });
    const photos = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    render(<SlideshowOffer every={12} slotKey='m1:show:all' country='IT' photos={photos} />);
    expect(screen.getByText('Hotels in Rome').getAttribute('href')).toBe('/go/1');
    expect(cardAt).toHaveBeenCalledWith(0, [{ id: 'c' }, { id: 'b' }, { id: 'a' }]);
    expect(useGalleryOffers.mock.calls[0][0]).toEqual({
      every: 12,
      slotKey: 'm1:show:all',
      placement: 'SLIDESHOW',
      country: 'IT',
      plannedTrip: { countryCode: 'IT' },
    });
  });

  it('shows nothing without a card', () => {
    useGalleryOffers.mockReturnValue(null);
    const { container } = render(<SlideshowOffer every={12} slotKey='k' photos={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
