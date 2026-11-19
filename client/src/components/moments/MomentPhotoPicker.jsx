import React, { useState } from 'react';
// Icons
import { FaCheck } from 'react-icons/fa';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import CheckboxInput from '@/components/ui/CheckboxInput';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { MOMENT_PHOTOS_MAX } from '@/utils/moments/momentKinds';
import { photoLabel } from '@/utils/photos/photoLabel';

const TILE = 'relative grid aspect-square overflow-hidden border-4 bg-poster-cream shadow-paper';

// A chosen photo's tile: its thumbnail, and a red check stamp in the corner
function ChosenMark() {
  return (
    <span className='absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-poster-cream bg-poster-red text-xs text-poster-cream'>
      <FaCheck aria-hidden='true' />
    </span>
  );
}

/**
 * Up to 20 of the map's photos for a moment (nothing is uploaded). `chosen` is
 * `[{ id, thumbUrl }]` in order. The photos offered come from `source` (a country's on
 * the map, or a trip's); `wholeMap` (a map editor's) adds a switch for every photo on
 * the map. Chosen photos stay chosen whatever is listed. `max` is a pin's visit's 50
 * (components/countryMap/PinVisitForm.jsx), with `fullText` saying so.
 */
function MomentPhotoPicker({
  idPrefix,
  source,
  wholeMap = null,
  chosen,
  onChange,
  max = MOMENT_PHOTOS_MAX,
  fullText = 'That’s the most a moment can have. Untick one to choose another.',
}) {
  const [open, setOpen] = useState(false);
  const [everywhere, setEverywhere] = useState(false);
  const photos = usePhotoPage({ ...(everywhere && wholeMap ? wholeMap : source), enabled: open });
  const chosenIds = new Set(chosen.map((p) => p.id));
  const full = chosen.length >= max;
  const listedIds = new Set(photos.photos.map((p) => p.id));
  // Chosen photos the list doesn't show (another country, say) come first
  const offered = open ? [...chosen.filter((p) => !listedIds.has(p.id)), ...photos.photos] : [];

  const toggle = (photo) =>
    onChange(chosenIds.has(photo.id) ? chosen.filter((p) => p.id !== photo.id) : [...chosen, { id: photo.id, thumbUrl: photo.thumbUrl }]);

  return (
    <fieldset className='grid gap-2'>
      <legend className='font-travel text-base uppercase tracking-wide text-poster-brown'>Photos</legend>
      <p className='text-sm' aria-live='polite'>
        {chosen.length} of {max} chosen
      </p>
      {!open && chosen.length ? (
        <ul className='grid grid-cols-5 gap-1.5' aria-label='Chosen photos'>
          {chosen.map((photo) => (
            <li key={photo.id} className={`${TILE} border-poster-cream`}>
              {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' className='h-full w-full object-cover' /> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type='button'
        aria-expanded={open}
        onClick={() => setOpen((on) => !on)}
        className='justify-self-start text-sm font-medium underline underline-offset-2'
      >
        {open ? 'Done choosing photos' : 'Choose photos'}
      </button>

      {open ? (
        <div className='grid gap-2'>
          {wholeMap ? (
            <CheckboxInput
              id={`${idPrefix}-everywhere`}
              checked={everywhere}
              onChange={(e) => setEverywhere(e.target.checked)}
              label='Show photos from anywhere on the map'
            />
          ) : null}
          {offered.length ? (
            <ul className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
              {offered.map((photo) => {
                const on = chosenIds.has(photo.id);
                return (
                  <li key={photo.id}>
                    <button
                      type='button'
                      aria-pressed={on}
                      disabled={!on && full}
                      onClick={() => toggle(photo)}
                      className={`${TILE} w-full disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'border-poster-red' : 'border-poster-cream'}`}
                    >
                      {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' draggable={false} className='h-full w-full object-cover' /> : null}
                      <span className='sr-only'>{photo.caption !== undefined ? photoLabel(photo) : 'A chosen photo'}</span>
                      {on ? <ChosenMark /> : null}
                    </button>
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
            <button type='button' onClick={photos.loadMore} className='justify-self-start text-sm font-medium underline underline-offset-2'>
              Show more photos
            </button>
          ) : null}
          {full ? <p className='text-xs'>{fullText}</p> : null}
        </div>
      ) : null}
    </fieldset>
  );
}

export default MomentPhotoPicker;
