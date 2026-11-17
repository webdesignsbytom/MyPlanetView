import React from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { formatDay } from '@/utils/functions/dates';
import { promoOfferWords, promoSignUpLink } from '@/utils/plans/promoCodes';
import { promoState } from '@/utils/plans/promoCodeForm';

const STATE_TONES = { on: 'tone-good', off: 'tone-danger', ended: 'tone-warn', used: 'tone-warn' };
const count = (n) => Number(n || 0).toLocaleString('en-GB');

// One code on the admin page, as a slip of paper in the card: the code and its label, where
// it stands (on, off, ended, used up), the offer, its limits and link, what it brought, and its
// actions (change it; turn it off or on).
function PromoCodeItem({ promo, busy, onEdit, onToggle }) {
  const headingId = `promo-${promo.id}-heading`;
  const state = promoState(promo);

  return (
    <article
      className='grid content-start gap-3 border-2 border-dashed border-poster-brown/60 bg-paper-cream px-4 py-4'
      aria-labelledby={headingId}
      aria-busy={busy ? 'true' : 'false'}
    >
      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
        <div className='grid min-w-0 gap-1'>
          <h3 id={headingId} className='break-all font-travel text-2xl uppercase leading-tight tracking-wide text-poster-red-deep'>
            {promo.code}
          </h3>
          <p className='break-words text-sm'>{promo.label}</p>
        </div>
        <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATE_TONES[state.key]}`}>{state.label}</span>
      </div>

      <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm'>
        <dt className='font-semibold text-colour9'>Offer</dt>
        <dd>{promoOfferWords(promo)}</dd>
        <dt className='font-semibold text-colour9'>Limit</dt>
        <dd>{promo.maxUses == null ? 'No limit' : `Up to ${count(promo.maxUses)} sign-ups`}</dd>
        <dt className='font-semibold text-colour9'>Last day</dt>
        <dd>{promo.endsAt ? formatDay(promo.endsAt) : 'No end date'}</dd>
        <dt className='font-semibold text-colour9'>Link</dt>
        <dd className='break-all'>{promoSignUpLink(promo.code)}</dd>
      </dl>

      <dl className='grid grid-cols-2 gap-2 border-t-2 border-dashed border-poster-brown/40 pt-3 text-center sm:grid-cols-4'>
        {[
          ['Sign-ups', promo.signUps],
          ['Verified', promo.verified],
          ['Free months', promo.trials],
          ['Paying', promo.paying],
        ].map(([label, value]) => (
          <div key={label} className='grid gap-0.5'>
            <dt className='text-xs uppercase tracking-wide text-colour9'>{label}</dt>
            <dd className='font-travel text-2xl leading-none'>{count(value)}</dd>
          </div>
        ))}
      </dl>

      <div className='grid grid-row justify-end gap-2'>
        <Button small quiet ariaLabel={`Change ${promo.code}`} disabled={busy} onClick={() => onEdit(promo)}>
          Change
        </Button>
        <Button
          small
          danger={promo.active}
          quiet={!promo.active}
          busy={busy}
          ariaLabel={`${promo.active ? 'Turn off' : 'Turn on'} ${promo.code}`}
          onClick={() => onToggle(promo)}
        >
          {promo.active ? 'Turn off' : 'Turn on'}
        </Button>
      </div>
    </article>
  );
}

export default PromoCodeItem;
