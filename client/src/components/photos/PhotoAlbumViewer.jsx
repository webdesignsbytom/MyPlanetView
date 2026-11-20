import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
// Icons
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';
// Components
import CloseStamp from '@/components/common/CloseStamp';
import MapRoundButton from '@/components/map/MapRoundButton';
import VideoPlayer from './VideoPlayer';
// Utils
import { countryName } from '@/utils/map/countries';

const SWIPE_PX = 50;
// Fetch the next page this close to the end of what's loaded
const LOAD_AHEAD = 3;

/** A photo's title in the album: its caption, else its country. */
const albumTitle = (photo) => photo?.caption || (photo?.countryCode ? countryName(photo.countryCode) : 'Photo');

/**
 * The photo album's viewer (16 Nov 2026, the user's wish: "just the image and the title in
 * full screen; this is just a fun album"): the photo as big as the screen allows, its title,
 * and nothing to edit (editing is in the country panels and on the trip pages, through
 * PhotoViewer). The title is cut short to one line. Back and forward with the stamps under
 * the photo, the arrow keys or a swipe; the next
 * page of the album loads as the end comes near, and the neighbours' pictures are fetched
 * ahead. A video plays (VideoPlayer) once it's ready. Over everything, portalled; Escape or
 * the close stamp shuts it, focus back on the photo it opened from.
 * `photos` are the album's list items (with `displayUrl`: MAP_PHOTOS asks for it).
 */
function PhotoAlbumViewer({ photos, index, onIndex, hasMore = false, onLoadMore, onClose }) {
  const dialogRef = useModalA11y(onClose);
  const titleId = useId();
  const swipeRef = useRef(null);
  const count = photos.length;
  const photo = photos[index];

  const go = useCallback(
    (step) => {
      const next = index + step;
      if (next >= 0 && next < count) onIndex(next);
    },
    [index, count, onIndex],
  );

  // The arrow keys step through the album wherever focus is (a mouse click on a stamp lets
  // go of it), but not inside a video's own controls
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  }, [go]);
  useEffect(() => {
    const onKeyDown = (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.target?.closest?.('video, input, select, textarea')) return;
      e.preventDefault();
      goRef.current(step);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (hasMore && index >= count - LOAD_AHEAD) onLoadMore?.();
  }, [hasMore, index, count, onLoadMore]);

  // The pictures either side, so a step shows at once
  useEffect(() => {
    for (const near of [photos[index + 1], photos[index - 1]]) {
      if (near?.displayUrl && near.kind !== 'VIDEO') new Image().src = near.displayUrl;
    }
  }, [photos, index]);

  if (!photo) return null;
  const title = albumTitle(photo);
  const isVideo = photo.kind === 'VIDEO';

  return createPortal(
    <div
      ref={dialogRef}
      role='dialog'
      aria-modal='true'
      aria-labelledby={titleId}
      className='fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)_auto] bg-poster-ink text-poster-cream'
    >
      <header className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3'>
        <h2 id={titleId} className='truncate font-travel text-lg uppercase leading-tight tracking-wide sm:text-2xl'>
          {title}
        </h2>
        <CloseStamp label='Close the photo' onClick={onClose} />
      </header>

      {/* One row and column that fill the space, so the photo's max-h-full and max-w-full
          have a size to keep to: an auto row grew to the photo, which was drawn at its own
          size, cut off by the screen with the buttons over it (19 Nov 2026, the audit) */}
      <div
        className='grid min-h-0 touch-pan-y grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center overflow-hidden px-2'
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') swipeRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipeRef.current;
          swipeRef.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - start.y) * 1.5) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
      >
        {isVideo && photo.videoUrl ? (
          <div className='grid w-full max-w-5xl'>
            <VideoPlayer key={photo.id} photo={photo} />
          </div>
        ) : (
          <img
            key={photo.id}
            src={(!isVideo && photo.displayUrl) || photo.thumbUrl}
            alt={title}
            className='max-h-full max-w-full object-contain'
          />
        )}
      </div>

      {/* Back and forward under the photo, never over it (the user's wish); at either end of
          the album the button stays, switched off, so nothing moves */}
      <div className='grid grid-cols-2 items-center px-4 py-3'>
        <div className='grid justify-items-start'>
          <MapRoundButton label='Previous photo' onClick={() => go(-1)} disabled={index === 0}>
            <IoChevronBack aria-hidden='true' />
          </MapRoundButton>
        </div>
        <div className='grid justify-items-end'>
          <MapRoundButton label='Next photo' onClick={() => go(1)} disabled={index >= count - 1}>
            <IoChevronForward aria-hidden='true' />
          </MapRoundButton>
        </div>
      </div>
      {/* Where it is in the album, for screen readers only: the screen shows just the photo */}
      <p role='status' className='sr-only'>{`Photo ${index + 1} of ${count}${hasMore ? ' or more' : ''}: ${title}`}</p>
    </div>,
    document.body,
  );
}

export default PhotoAlbumViewer;
