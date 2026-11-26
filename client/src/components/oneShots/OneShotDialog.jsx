import React, { useState } from 'react';
import { createPortal } from 'react-dom';
// Components
import Modal from '@/components/common/Modal';
import TravelDesk from '@/components/offers/TravelDesk';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import OneShotPicture from './OneShotPicture';
import OneShotForm from './OneShotForm';
// Utils
import { ONE_SHOT_LIST_LABELS, ONE_SHOT_TICK_WORDS, oneShotGroupLabel, seenWords } from '@/utils/oneShots/oneShotWords';

const CREDIT_LINK = 'underline underline-offset-2 hover:text-colour6';

// The map's own photos of it (26 Nov 2026, the user's wish): the one shown large, the rest a
// press away beneath it
function OwnPhotos({ photos, name }) {
  const [shown, setShown] = useState(0);
  const current = photos[Math.min(shown, photos.length - 1)];
  return (
    <figure className='grid gap-2' data-one-shot-own-photos={photos.length}>
      <img
        src={current.displayUrl || current.thumbUrl}
        alt={`Photo ${Math.min(shown, photos.length - 1) + 1} of ${photos.length}: ${name}`}
        className='aspect-[4/3] w-full border-4 border-poster-cream object-cover shadow-paper'
      />
      {photos.length > 1 ? (
        <ul className='grid grid-cols-5 gap-1.5' aria-label='Your photos of it'>
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type='button'
                aria-pressed={i === shown}
                onClick={() => setShown(i)}
                className={`relative grid aspect-square w-full overflow-hidden border-4 bg-poster-cream shadow-paper ${i === shown ? 'border-poster-red' : 'border-poster-cream'}`}
              >
                {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' className='h-full w-full object-cover' /> : null}
                <span className='sr-only'>{`Show photo ${i + 1}`}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}

/**
 * One item of Life's One Shots, over the panel (portalled): the map's own photos of it once its
 * tick has some (26 Nov 2026), else its Commons photo with the credit its licence asks for, its
 * list and group, and the map's tick: when and where, who was there and its note. The owner
 * and editors (`canEdit`) tick it or change and take off its tick (OneShotForm, `uploader` for
 * new photos); one whose email isn't verified yet (`locked`) is told why. Not ticked, the
 * Travel Desk offers trips to where it's usually seen.
 */
function OneShotDialog({ item, photo, tick = null, start = null, canEdit = false, locked = false, travellers = [], photoSource = null, uploader = null, onSave, onRemove, onClose }) {
  const travellerNames = (tick?.travellerIds || []).map((id) => travellers.find((t) => t.id === id)?.name).filter(Boolean);
  const when = tick ? seenWords(tick) : '';
  const own = tick?.photos?.length ? tick.photos : tick?.photo ? [tick.photo] : [];
  return createPortal(
    <Modal title={item.name} onClose={onClose}>
      {own.length ? (
        <OwnPhotos key={own.map((p) => p.id).join()} photos={own} name={item.name} />
      ) : (
        <figure className='grid gap-1'>
          <OneShotPicture photo={photo} className='aspect-[4/3] w-full border-4 border-poster-cream shadow-paper' />
          {photo ? (
            <figcaption className='text-xs leading-snug opacity-80 [overflow-wrap:anywhere]'>
              Photo:{' '}
              <a href={photo.source} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
                {photo.author}
              </a>
              {photo.licence ? ', ' : null}
              {photo.licence && photo.licenceUrl ? (
                <a href={photo.licenceUrl} target='_blank' rel='noopener noreferrer' className={CREDIT_LINK}>
                  {photo.licence}
                </a>
              ) : (
                photo.licence
              )}
            </figcaption>
          ) : null}
        </figure>
      )}
      <p className='text-xs font-semibold uppercase tracking-wide text-poster-brown'>
        {ONE_SHOT_LIST_LABELS[item.list]} · {oneShotGroupLabel(item.list, item.group)}
      </p>

      {tick ? (
        <div className='grid gap-1 rounded-sm border-2 border-dashed border-poster-red/50 px-3 py-2' data-one-shot-tick=''>
          <p className='font-semibold text-poster-red-deep'>
            {ONE_SHOT_TICK_WORDS[item.list]}
            {when ? `: ${when}` : ''}
          </p>
          {travellerNames.length ? <p className='text-sm'>{travellerNames.join(', ')}</p> : null}
          {tick.notes ? <p className='whitespace-pre-line text-sm'>{tick.notes}</p> : null}
        </div>
      ) : (
        <p className='text-sm'>Not ticked yet on this map.</p>
      )}

      {canEdit && !locked ? (
        <OneShotForm item={item} tick={tick} start={start} travellers={travellers} photoSource={photoSource} uploader={uploader} onSave={onSave} onRemove={tick ? onRemove : null} />
      ) : null}
      {canEdit && locked ? <VerifyFirstNote action='tick Life’s One Shots' /> : null}

      {!tick && item.countries.length ? <TravelDesk countryCodes={item.countries.slice(0, 3)} /> : null}
    </Modal>,
    document.body,
  );
}

export default OneShotDialog;
