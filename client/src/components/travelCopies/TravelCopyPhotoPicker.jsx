import React, { useState } from 'react';
// Icons
import { FaCheck } from 'react-icons/fa';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { photoLabel } from '@/utils/photos/photoLabel';

const TILE = 'relative grid aspect-square w-full overflow-hidden border-4 bg-poster-cream shadow-paper';

/**
 * Photos of the family map picked one by one, for a travel copy (docs/API.md, "Travel
 * copies"), on top of the trips and countries ticked. `chosenIds` are the photos picked.
 * Hidden photos and videos never go, so they aren't offered (an editor's list has them).
 */
function TravelCopyPhotoPicker({ mapId, chosenIds, onChange }) {
  const [open, setOpen] = useState(false);
  const photos = usePhotoPage({ mapId, enabled: open });
  const chosen = new Set(chosenIds);
  const offered = photos.photos.filter((p) => !p.hidden && p.kind !== 'VIDEO');
  const toggle = (id) => onChange(chosen.has(id) ? chosenIds.filter((x) => x !== id) : [...chosenIds, id]);

  return (
    <fieldset className='grid gap-2'>
      <legend className='font-travel text-base uppercase tracking-wide text-poster-brown'>Photos one by one</legend>
      <p className='text-sm' aria-live='polite'>
        {chosenIds.length ? `${chosenIds.length} picked` : 'Any photo on the map, as well as the trips and countries ticked.'}
      </p>
      <button
        type='button'
        aria-expanded={open}
        onClick={() => setOpen((on) => !on)}
        className='justify-self-start text-sm font-medium underline underline-offset-2'
      >
        {open ? 'Done picking photos' : 'Pick photos'}
      </button>
      {open ? (
        <div className='grid gap-2'>
          {offered.length ? (
            <ul className='grid grid-cols-3 gap-2 sm:grid-cols-5'>
              {offered.map((photo) => {
                const on = chosen.has(photo.id);
                return (
                  <li key={photo.id}>
                    <button
                      type='button'
                      aria-pressed={on}
                      onClick={() => toggle(photo.id)}
                      className={`${TILE} ${on ? 'border-poster-red' : 'border-poster-cream'}`}
                    >
                      {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' draggable={false} className='h-full w-full object-cover' /> : null}
                      <span className='sr-only'>{photoLabel(photo)}</span>
                      {on ? (
                        <span className='absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-poster-cream bg-poster-red text-xs text-poster-cream'>
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
        </div>
      ) : null}
    </fieldset>
  );
}

export default TravelCopyPhotoPicker;
