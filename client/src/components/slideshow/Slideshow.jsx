import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';
import useWakeLock from '@/hooks/useWakeLock';
import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion';
import useSlideshowPhotos from '@/hooks/useSlideshowPhotos';
// Components
import PaperStripHeader from '@/components/common/PaperStripHeader';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import SlidePhoto from './SlidePhoto';
import SlideVideo from './SlideVideo';
import SlideTitleCard from './SlideTitleCard';
import SlideCaption from './SlideCaption';
import SlideshowControls from './SlideshowControls';
import SlideshowOffer from './SlideshowOffer';
// Utils
import { getStoredItem, setStoredItem } from '@/utils/functions/safeStorage';
import {
  DEFAULT_SLIDE_SPEED,
  SLIDE_FETCH_AHEAD,
  SLIDE_SPEEDS,
  SLIDE_SPEED_STORAGE_KEY,
  TITLE_CARD_SECONDS,
  buildSlides,
  newShuffleSeed,
  photoPlace,
} from '@/utils/photos/slideshow';
import { formatDay } from '@/utils/functions/dates';

const SWIPE_PX = 40;
const PRELOAD_AHEAD = 2;

function storedSpeed() {
  const value = Number(getStoredItem(SLIDE_SPEED_STORAGE_KEY));
  return SLIDE_SPEEDS.includes(value) ? value : DEFAULT_SLIDE_SPEED;
}

// What a photo is, for its alt text: its caption, else its place and day
const altFor = (photo) =>
  photo.caption || [photoPlace(photo), photo.takenAt ? formatDay(photo.takenAt) : null].filter(Boolean).join(', ') || 'Photo';

// Keys that belong to what has focus (typing, a button pressed with Space)
const ownsKey = (target) => Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));

/**
 * A slideshow of a map's photos (worldwide), one country's, or one trip's (docs/FEATURE-
 * PLAN.md, "Slideshows"), full screen over the page. `source` is `{ mapId }`, `{ tripId }`
 * or `{ shareCode }`; `country` keeps one country's. The worldwide show (`titleCards`)
 * puts the country's poster up whenever the country changes.
 *
 * - **Order:** oldest taken first; "Shuffle" starts it again in a new random order (a new
 *   seed each time, so the server pages the same order: docs/API.md, "Slideshows").
 * - **Controls:** play and pause, back and forward, 3, 5 or 8 seconds a photo
 *   (remembered), the arrow keys and Space, a swipe on touch screens, full screen.
 * - **Behind the scenes:** the next pages arrive as it plays; the next two photos are
 *   fetched ahead; the screen stays awake while it plays (useWakeLock); with reduced
 *   motion it cuts from photo to photo with no fade or zoom.
 * - **Screen readers:** a modal dialog; each slide's words are announced when it's moved
 *   by hand, not while it plays by itself (as a carousel does).
 * Viewers never get hidden photos: the API leaves them out.
 * - **Videos** (First Class): a video plays through (muted until its sound button is
 *   pressed), then the show moves on, instead of on the timer; one this browser can't
 *   play shows its poster frame for the usual time (SlideVideo).
 * - **A travel offer** (docs/API.md, "Travel offers"): where the map's galleries show
 *   cards (`adEvery` set), one comes on the end card, never mid-show (SlideshowOffer).
 *   `nextTrip`, `canFetchTrips` and `mapKey` are as for CountryPanel's.
 */
function Slideshow({ source, country = null, title, titleCards = false, adEvery = null, nextTrip = null, canFetchTrips = true, mapKey = '', onClose }) {
  const titleId = useId();
  const dialogRef = useModalA11y(onClose);
  const playRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  const [shuffle, setShuffle] = useState(false);
  const [seed, setSeed] = useState(newShuffleSeed);
  const [run, setRun] = useState(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(storedSpeed);
  const [readyId, setReadyId] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState(null);
  // Videos: muted until asked (then for the rest of the show), the one that couldn't play
  // (it shows its poster on the timer), and one that ended before the next page arrived
  const [muted, setMuted] = useState(true);
  const [videoFailedId, setVideoFailedId] = useState(null);
  const [videoEndedId, setVideoEndedId] = useState(null);

  const list = useSlideshowPhotos({
    mapId: source.mapId,
    tripId: source.tripId,
    shareCode: source.shareCode,
    country: country || undefined,
    order: shuffle ? 'shuffle' : 'taken',
    seed,
    run,
  });
  const slides = useMemo(() => buildSlides(list.photos, { titleCards, complete: list.complete }), [list.photos, titleCards, list.complete]);
  const slide = slides[index] || null;
  const photoNumber = useMemo(() => slides.slice(0, index + 1).filter((s) => s.type === 'photo').length, [slides, index]);
  const canFullscreen = typeof document !== 'undefined' && Boolean(document.fullscreenEnabled);

  // Start again from the first photo: a new order when shuffled (a new show, a new seed)
  const restart = useCallback((nextShuffle) => {
    setShuffle(nextShuffle);
    if (nextShuffle) setSeed(newShuffleSeed());
    setRun((r) => r + 1);
    setIndex(0);
    setReadyId(null);
  }, []);

  const lastIndex = slides.length - 1;
  const next = useCallback(() => setIndex((i) => (i < lastIndex ? i + 1 : i)), [lastIndex]);
  const previous = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : i)), []);
  const atEnd = slide?.type === 'end';
  const togglePlay = useCallback(() => {
    // Playing again from the end card starts the show over
    if (!playing && atEnd) restart(shuffle);
    setPlaying(!playing);
  }, [playing, atEnd, restart, shuffle]);
  const playAgain = (shuffled) => {
    setPlaying(true);
    restart(shuffled);
  };

  // The server lost its place in the shuffled order (a photo deleted or hidden as it
  // played): start the show again, in a new order
  useEffect(() => {
    if (!list.stale) return;
    setNotice('The photos changed while the show played, so it started again.');
    restart(true);
  }, [list.stale, restart]);

  const slideId = slide?.id ?? null;
  const slideType = slide?.type ?? null;
  // A video that can play moves the show on when it ends, not on the timer
  const playsThrough = slideType === 'photo' && slide.photo.kind === 'VIDEO' && videoFailedId !== slideId;
  // A slide with no picture to wait for is ready at once. (By its id and kind: the list of
  // slides is rebuilt as each page arrives, and that mustn't restart the clock.)
  useEffect(() => {
    if (slideId && slideType !== 'photo') setReadyId(slideId);
  }, [slideId, slideType]);

  // Playing: each slide stays up for the chosen time from when it's ready (a title card
  // no longer than TITLE_CARD_SECONDS); at the end card the show stops
  const hasNext = index < lastIndex;
  useEffect(() => {
    if (!playing || !slideId || readyId !== slideId) return undefined;
    if (slideType === 'end') {
      setPlaying(false);
      return undefined;
    }
    if (!hasNext) return undefined; // the next page is still coming
    // A video moves on when it ends (videoEnded); one that ended while the next page was
    // still coming moves on now
    if (playsThrough && videoEndedId !== slideId) return undefined;
    const seconds = playsThrough ? 0 : slideType === 'card' ? Math.min(speed, TITLE_CARD_SECONDS) : speed;
    const timer = window.setTimeout(() => setIndex((i) => i + 1), seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [playing, slideId, slideType, readyId, speed, hasNext, playsThrough, videoEndedId]);

  // A video played through: on to the next slide (while the show plays)
  const videoEnded = (id) => {
    if (id !== slideId || !playing) return;
    if (hasNext) setIndex((i) => i + 1);
    else setVideoEndedId(id);
  };
  // Leaving a slide forgets that its video had ended, so coming back plays it again
  useEffect(() => {
    setVideoEndedId(null);
  }, [index]);

  // The next page, before the show gets to the end of this one
  const { loadMore, nextCursor, loading } = list;
  useEffect(() => {
    if (nextCursor && !loading && index >= slides.length - SLIDE_FETCH_AHEAD) loadMore();
  }, [index, slides.length, nextCursor, loading, loadMore]);

  // The next two photos' display copies, fetched ahead so they show at once
  const preloadedRef = useRef(new Map());
  useEffect(() => {
    const ahead = slides.slice(index + 1).filter((s) => s.type === 'photo').slice(0, PRELOAD_AHEAD);
    for (const { photo } of ahead) {
      const url = photo.displayUrl || photo.thumbUrl;
      if (!url || preloadedRef.current.has(url)) continue;
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      preloadedRef.current.set(url, image);
    }
    // Keep only a few in hand
    for (const url of [...preloadedRef.current.keys()].slice(0, -PRELOAD_AHEAD * 2)) preloadedRef.current.delete(url);
  }, [slides, index]);

  // The screen stays awake while it plays
  useWakeLock(playing && slides.length > 0);

  // Full screen: the show's own frame, followed as the browser enters and leaves it
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else dialogRef.current?.requestFullscreen?.().catch(() => {});
  };

  // The speed is remembered in this browser
  const chooseSpeed = (seconds) => {
    setSpeed(seconds);
    setStoredItem(SLIDE_SPEED_STORAGE_KEY, String(seconds));
  };

  // Keys anywhere while it's open: arrows step, Space plays and pauses (a focused button
  // takes its own Space press). Escape is useModalA11y's (it closes the show).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || ownsKey(e.target)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previous();
      } else if (e.key === ' ' && !e.target?.closest?.('button, a')) {
        e.preventDefault();
        togglePlay();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [next, previous, togglePlay]);

  // Opening: focus goes to Play (useModalA11y put it on the first control, the close stamp)
  useEffect(() => {
    playRef.current?.querySelector('button')?.focus();
  }, []);

  // A swipe on a touch screen: left for the next, right for the one before
  const swipeRef = useRef(null);
  const swipeHandlers = {
    onPointerDown: (e) => {
      swipeRef.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e) => {
      const start = swipeRef.current;
      swipeRef.current = null;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) next();
      else previous();
    },
    onPointerCancel: () => {
      swipeRef.current = null;
    },
  };

  const empty = !list.loading && !list.error && list.complete && !list.photos.length;
  const counter = slide?.type === 'photo' ? `Photo ${photoNumber}${list.complete ? ` of ${list.photos.length}` : ''}` : '';

  return (
    <div className='fixed inset-0 z-50 grid bg-scrim sm:p-4' onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className='ticket-edge paper-fields grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-paper-cream text-colour4 sm:mx-auto sm:max-w-6xl'
      >
        <PaperStripHeader titleId={titleId} title={title} onClose={onClose} closeLabel='Close the slideshow' />

        <div
          {...swipeHandlers}
          data-slide-id={slide?.id ?? ''}
          data-slide-kind={slide?.type ?? ''}
          data-slide-index={index}
          // One fixed cell, so the photo's max-h-full and max-w-full have a size to keep to
          className='paper-aged relative grid min-h-0 touch-pan-y grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center overflow-hidden p-3 text-poster-ink sm:p-6'
        >
          {list.error ? (
            <InlineAlert>{list.error}</InlineAlert>
          ) : empty ? (
            <p className='font-travel text-xl uppercase tracking-wide'>No photos to play yet.</p>
          ) : !slide ? (
            <div role='status' className='grid place-items-center'>
              <LoadingSpinner md />
              <span className='sr-only'>Loading the photos…</span>
            </div>
          ) : slide.type === 'photo' && slide.photo.kind === 'VIDEO' ? (
            <SlideVideo
              key={slide.id}
              photo={slide.photo}
              alt={altFor(slide.photo)}
              playing={playing}
              muted={muted}
              onMutedChange={setMuted}
              reducedMotion={reducedMotion}
              onReady={setReadyId}
              onEnded={videoEnded}
              onFailed={setVideoFailedId}
            />
          ) : slide.type === 'photo' ? (
            <SlidePhoto key={slide.id} photo={slide.photo} alt={altFor(slide.photo)} reducedMotion={reducedMotion} onReady={setReadyId} />
          ) : slide.type === 'card' ? (
            <SlideTitleCard key={slide.id} countryCode={slide.countryCode} first={index === 0} />
          ) : (
            <div className='grid max-h-full justify-items-center gap-4 overflow-y-auto p-1 text-center'>
              <p className='-rotate-2 border-4 border-double border-poster-red px-4 py-2 font-travel text-4xl uppercase text-poster-red'>The end</p>
              {/* Side by side at their own widths (a wrapping row sized to fit squeezed them together) */}
              <div className='grid grid-row justify-center gap-2'>
                <Button onClick={() => playAgain(false)}>Play again</Button>
                <Button quiet onClick={() => playAgain(true)}>
                  Shuffle and play
                </Button>
              </div>
              {adEvery ? (
                <SlideshowOffer
                  every={adEvery}
                  slotKey={`${mapKey}:show:${country || source.tripId || 'all'}`}
                  country={country}
                  photos={list.photos}
                  nextTrip={nextTrip}
                  canFetchTrips={canFetchTrips}
                />
              ) : null}
            </div>
          )}
        </div>

        <footer className='grid gap-3 border-t-2 border-dashed border-poster-brown px-4 py-3 sm:px-6'>
          {/* What's on screen, read out when moved by hand (not while it plays by itself) */}
          <div className='grid grid-cols-rev items-start gap-3' aria-live={playing ? 'off' : 'polite'} aria-atomic='true'>
            <SlideCaption slide={slide} photoCount={list.photos.length} />
            <p className='text-xs font-medium tabular-nums'>{counter}</p>
          </div>
          {notice ? <InlineAlert tone='info'>{notice}</InlineAlert> : null}
          <SlideshowControls
            playing={playing}
            onPlayPause={togglePlay}
            onPrevious={previous}
            onNext={next}
            canPrevious={index > 0}
            canNext={hasNext}
            shuffle={shuffle}
            onShuffle={() => restart(!shuffle)}
            speed={speed}
            onSpeed={chooseSpeed}
            fullscreen={fullscreen}
            canFullscreen={canFullscreen}
            onFullscreen={toggleFullscreen}
            playRef={playRef}
          />
        </footer>
      </div>
    </div>
  );
}

export default Slideshow;
