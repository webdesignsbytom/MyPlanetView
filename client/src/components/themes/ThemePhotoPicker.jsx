import React, { useEffect, useState } from 'react';
// Icons
import { FaCheck } from 'react-icons/fa';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Api
import { enterPhotoInTheme, getThemeAlbumPage } from '@/api/themesApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { photoLabel } from '@/utils/photos/photoLabel';

const TILE = 'relative grid aspect-square w-full overflow-hidden border-4 bg-poster-cream shadow-paper';

/**
 * Choosing the map's photos for this month's theme (docs/API.md, "Photo themes"): any
 * photo on the map, from any date, newest upload first; not videos; the ones already in
 * are marked. Up to `theme.entriesLeft` at a time. "Enter" sends them one by one and says
 * which didn't go in. `onEntered` once any did.
 */
function ThemePhotoPicker({ theme, mapId, onEntered, onClose }) {
  const photos = usePhotoPage({ mapId, limit: 60 });
  const [inTheme, setInTheme] = useState(() => new Set());
  const [chosen, setChosen] = useState([]);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState([]);
  const room = theme.entriesLeft ?? 0;
  const full = chosen.length >= room;
  const offered = photos.photos.filter((p) => p.kind !== 'VIDEO');

  // The photos already in (at most the cap, so one page)
  useEffect(() => {
    let cancelled = false;
    getThemeAlbumPage({ mapId }, theme.id, { limit: 60 })
      .then(({ photos: entered }) => {
        if (!cancelled) setInTheme(new Set((entered ?? []).map((p) => p.id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mapId, theme.id]);

  const toggle = (photo) => setChosen((prev) => (prev.includes(photo.id) ? prev.filter((id) => id !== photo.id) : [...prev, photo.id]));

  const enter = async () => {
    setBusy(true);
    setProblems([]);
    const failed = [];
    const entered = [];
    for (const photoId of chosen) {
      try {
        await enterPhotoInTheme(photoId, theme.id);
        entered.push(photoId);
      } catch (err) {
        const photo = offered.find((p) => p.id === photoId);
        failed.push(`${photo ? photoLabel(photo) : 'A photo'}: ${err.friendlyMessage || 'it couldn’t be entered.'}`);
      }
    }
    setBusy(false);
    if (entered.length) onEntered?.();
    if (failed.length) {
      setProblems(failed);
      setChosen([]);
      setInTheme((prev) => new Set([...prev, ...entered]));
    } else {
      onClose();
    }
  };

  return (
    <Modal title={`Choose photos for “${theme.title}”`} onClose={onClose} wide>
      <p className='text-sm'>
        Any photo on the map, from any trip or year. {room} more can go in this month
        {chosen.length ? `: ${chosen.length} chosen` : ''}.
      </p>
      {problems.length ? (
        <InlineAlert>
          Some didn’t go in. {problems.join(' ')}
        </InlineAlert>
      ) : null}
      {offered.length ? (
        <ul className='grid grid-cols-3 gap-2 sm:grid-cols-5' aria-label='Photos on the map'>
          {offered.map((photo) => {
            const already = inTheme.has(photo.id);
            const on = chosen.includes(photo.id);
            return (
              <li key={photo.id}>
                <button
                  type='button'
                  aria-pressed={already || on}
                  disabled={already || (!on && full) || busy}
                  onClick={() => toggle(photo)}
                  className={`${TILE} disabled:cursor-not-allowed ${already ? 'border-poster-brown opacity-60' : on ? 'border-poster-red' : 'border-poster-cream'} ${
                    !already && !on && full ? 'disabled:opacity-40' : ''
                  }`}
                >
                  {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' draggable={false} className='h-full w-full object-cover' /> : null}
                  <span className='sr-only'>
                    {photoLabel(photo)}
                    {already ? ' (already in the theme)' : ''}
                  </span>
                  {already || on ? (
                    <span className='absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-poster-cream bg-poster-red-strong text-xs text-poster-cream'>
                      <FaCheck aria-hidden='true' />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : photos.loading ? null : (
        <p className='text-sm opacity-80'>{photos.error || 'No photos on this map yet.'}</p>
      )}
      {photos.loading ? (
        <div className='grid place-items-center py-2' role='status'>
          <LoadingSpinner />
          <span className='sr-only'>Loading photos…</span>
        </div>
      ) : null}
      {photos.nextCursor && !photos.loading ? (
        <button type='button' onClick={photos.loadMore} className='justify-self-start text-sm font-medium underline underline-offset-2'>
          Show more photos
        </button>
      ) : null}
      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onClose}>
          Cancel
        </Button>
        <Button busy={busy} disabled={!chosen.length} onClick={enter}>
          {chosen.length === 1 ? 'Enter 1 photo' : `Enter ${chosen.length} photos`}
        </Button>
      </div>
    </Modal>
  );
}

export default ThemePhotoPicker;
