import React from 'react';
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

/**
 * One item of Life's One Shots, over the panel (portalled): its photo with the credit its
 * licence asks for, its list and group, and the map's tick: when and where, who was there,
 * its photo and note. The owner and editors (`canEdit`) tick it or change and take off its
 * tick (OneShotForm); one whose email isn't verified yet (`locked`) is told why. Not ticked,
 * the Travel Desk offers trips to where it's usually seen.
 */
function OneShotDialog({ item, photo, tick = null, start = null, canEdit = false, locked = false, travellers = [], photoSource = null, onSave, onRemove, onClose }) {
  const travellerNames = (tick?.travellerIds || []).map((id) => travellers.find((t) => t.id === id)?.name).filter(Boolean);
  const when = tick ? seenWords(tick) : '';
  return createPortal(
    <Modal title={item.name} onClose={onClose}>
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
          {tick.photo?.thumbUrl && !canEdit ? <img src={tick.photo.thumbUrl} alt='' className='h-24 w-auto justify-self-start rounded-sm shadow-paper' /> : null}
        </div>
      ) : (
        <p className='text-sm'>Not ticked yet on this map.</p>
      )}

      {canEdit && !locked ? (
        <OneShotForm item={item} tick={tick} start={start} travellers={travellers} photoSource={photoSource} onSave={onSave} onRemove={tick ? onRemove : null} />
      ) : null}
      {canEdit && locked ? <VerifyFirstNote action='tick Life’s One Shots' /> : null}

      {!tick && item.countries.length ? <TravelDesk countryCodes={item.countries.slice(0, 3)} /> : null}
    </Modal>,
    document.body,
  );
}

export default OneShotDialog;
