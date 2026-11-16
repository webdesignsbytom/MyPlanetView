import React from 'react';
// Components
import Button from '@/components/common/Button';
import OfferPicture from './OfferPicture';
import OfferClicks from './OfferClicks';
// Utils
import { kindLabel, offerCountryWords, offerDatesWords, offerState, placementLabel } from '@/utils/offers/offerAdmin';

const STATE_TONES = { on: 'tone-good', scheduled: 'tone-info', ended: 'tone-warn', off: 'tone-muted' };

// One offer on the admin page, as a slip of paper in the list: its picture (or kind), its
// line, partner, kind and key, where it stands (on, off, scheduled, ended), where and how
// often it shows, its link, its clicks over 30 days, and its actions (change it, turn it
// off or on, delete it).
function OfferItem({ offer, since, busy, onEdit, onToggle, onDelete }) {
  const headingId = `offer-${offer.id}-heading`;
  const state = offerState(offer);

  return (
    <article
      className='grid content-start gap-3 border-2 border-dashed border-poster-brown/60 bg-paper-cream px-4 py-4'
      aria-labelledby={headingId}
      aria-busy={busy ? 'true' : 'false'}
    >
      <div className='grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-3'>
        <OfferPicture imageKey={offer.imageKey} kind={offer.kind} className='aspect-[3/4] w-18 rounded border-2 border-poster-brown/60' />
        <div className='grid min-w-0 gap-1'>
          <h3 id={headingId} className='break-words font-travel text-xl leading-tight tracking-wide text-poster-red-deep'>
            {offer.title}
          </h3>
          <p className='break-words text-sm'>
            {offer.partner} · {kindLabel(offer.kind)}
          </p>
          <p className='break-all font-mono text-xs opacity-80'>{offer.key}</p>
        </div>
        <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATE_TONES[state.key]}`}>{state.label}</span>
      </div>

      {offer.blurb ? <p className='break-words text-sm'>{offer.blurb}</p> : null}

      <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm'>
        <dt className='font-semibold text-colour9'>Country</dt>
        <dd>{offerCountryWords(offer.countryCode)}</dd>
        <dt className='font-semibold text-colour9'>Shows on</dt>
        <dd>{(offer.placements || []).map(placementLabel).join(', ')}</dd>
        <dt className='font-semibold text-colour9'>Weight</dt>
        <dd>{offer.weight}</dd>
        <dt className='font-semibold text-colour9'>Dates</dt>
        <dd>{offerDatesWords(offer)}</dd>
        <dt className='font-semibold text-colour9'>Link</dt>
        <dd className='break-all text-xs'>{offer.url}</dd>
      </dl>

      <OfferClicks offer={offer} since={since} />

      <div className='grid grid-row-wrap justify-end gap-2'>
        <Button small quiet ariaLabel={`Change ${offer.title}`} disabled={busy} onClick={() => onEdit(offer)}>
          Change
        </Button>
        <Button
          small
          quiet
          busy={busy}
          ariaLabel={`${offer.active ? 'Turn off' : 'Turn on'} ${offer.title}`}
          onClick={() => onToggle(offer)}
        >
          {offer.active ? 'Turn off' : 'Turn on'}
        </Button>
        <Button small danger ariaLabel={`Delete ${offer.title}`} disabled={busy} onClick={() => onDelete(offer)}>
          Delete
        </Button>
      </div>
    </article>
  );
}

export default OfferItem;
