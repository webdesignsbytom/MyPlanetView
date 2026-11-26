import React from 'react';
// Icons
import { FaCheck, FaPlay } from 'react-icons/fa';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { SHOW_PHOTOS_MAX, choosable } from '@/utils/shows/showRules';
import { photoLabel } from '@/utils/photos/photoLabel';

const TILE = 'relative grid aspect-square w-full overflow-hidden border-4 bg-poster-cream shadow-paper';
const LINK_BUTTON = 'text-sm font-medium underline underline-offset-2 disabled:no-underline disabled:opacity-50';

/**
 * The photos and videos a slideshow can hold, to tick (ShowMakerDialog; 25 Nov 2026): those of
 * `source` (the photo album's, a country's or a trip's list: the same filters as the gallery it
 * was opened from, so it shows at once from the panel cache). A hidden one can't go in a show:
 * its tile says so and can't be ticked. `chosen` is the photos ticked, in the order ticked
 * (`[{ id, takenAt, thumbUrl }]`). "Choose all" ticks every one listed, "Clear" none.
 */
function ShowPhotoPicker({ source, chosen, onChange }) {
  const photos = usePhotoPage(source);
  const chosenIds = new Set(chosen.map((photo) => photo.id));
  const full = chosen.length >= SHOW_PHOTOS_MAX;
  const offered = photos.photos;
  const open = offered.filter((photo) => choosable(photo) && !chosenIds.has(photo.id));

  const pick = (photo) => ({ id: photo.id, takenAt: photo.takenAt ?? null, thumbUrl: photo.thumbUrl ?? null });
  const toggle = (photo) => onChange(chosenIds.has(photo.id) ? chosen.filter((p) => p.id !== photo.id) : [...chosen, pick(photo)]);
  const chooseAll = () => onChange([...chosen, ...open.slice(0, SHOW_PHOTOS_MAX - chosen.length).map(pick)]);

  return (
    <fieldset className='grid gap-2'>
      <legend className='font-travel text-base uppercase tracking-wide text-poster-brown'>Choose the photos</legend>
      <div className='grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3'>
        <p className='text-sm' aria-live='polite' data-show-chosen={chosen.length}>
          {chosen.length ? `${chosen.length.toLocaleString('en-GB')} chosen` : 'None chosen yet'}
        </p>
        <button type='button' onClick={chooseAll} disabled={!open.length || full} className={LINK_BUTTON}>
          Choose all
        </button>
        <button type='button' onClick={() => onChange([])} disabled={!chosen.length} className={LINK_BUTTON}>
          Clear
        </button>
      </div>

      {offered.length ? (
        <ul className='grid grid-cols-3 gap-2 sm:grid-cols-5' aria-label='Photos to choose from'>
          {offered.map((photo) => {
            const on = chosenIds.has(photo.id);
            const hidden = !choosable(photo);
            return (
              <li key={photo.id} className='grid gap-0.5'>
                <button
                  type='button'
                  aria-pressed={on}
                  disabled={hidden || (!on && full)}
                  onClick={() => toggle(photo)}
                  data-show-photo={photo.id}
                  className={`${TILE} disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'border-poster-red' : 'border-poster-cream'}`}
                >
                  {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' draggable={false} className='h-full w-full object-cover' /> : null}
                  <span className='sr-only'>
                    {photoLabel(photo)}
                    {hidden ? ' (hidden: it can’t go in a slideshow)' : ''}
                  </span>
                  {photo.kind === 'VIDEO' ? (
                    <span className='absolute bottom-1 left-1 grid h-6 w-6 place-items-center rounded-full bg-poster-ink/70 text-2xs text-poster-cream'>
                      <FaPlay aria-hidden='true' />
                    </span>
                  ) : null}
                  {on ? (
                    <span className='absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-poster-cream bg-poster-red-strong text-xs text-poster-cream'>
                      <FaCheck aria-hidden='true' />
                    </span>
                  ) : null}
                </button>
                {hidden ? (
                  <span aria-hidden='true' className='text-center text-2xs'>
                    Hidden
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : photos.loading ? null : (
        <p className='text-sm opacity-80'>{photos.error || 'No photos here yet.'}</p>
      )}
      {photos.loading ? (
        <div className='grid place-items-center py-2' role='status'>
          <LoadingSpinner />
          <span className='sr-only'>Loading photos…</span>
        </div>
      ) : null}
      {photos.nextCursor && !photos.loading ? (
        <button type='button' onClick={photos.loadMore} className={`justify-self-start ${LINK_BUTTON}`}>
          Show more photos
        </button>
      ) : null}
      {full ? <p className='text-xs'>That’s the most a slideshow can have. Untick one to choose another.</p> : null}
    </fieldset>
  );
}

export default ShowPhotoPicker;
