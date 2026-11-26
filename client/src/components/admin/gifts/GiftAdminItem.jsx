import React from 'react';
// Utils
import { giftStatusWords, giftWords, whenWords } from '@/utils/admin/adminWords';

const STATUS_TONES = { READY: 'tone-info', REDEEMED: 'tone-good', REFUNDED: 'tone-danger', UNPAID: 'tone-muted' };

/** Who: their name and address, the address a link to write to them */
function Person({ who }) {
  if (!who) return <span>an account since deleted</span>;
  return (
    <span>
      {who.name} (
      <a href={`mailto:${who.email}`} className='underline'>
        {who.email}
      </a>
      )
    </span>
  );
}

/**
 * One gift as the admin sees it (docs/API.md "Admin"): its code, what it is, its state, who
 * bought it and for whom, who redeemed it and until when the plan runs.
 */
function GiftAdminItem({ gift }) {
  return (
    <article aria-label={`Gift ${gift.code}`} className='grid gap-2 border-2 border-poster-brown bg-paper-cream p-4' data-admin-gift={gift.code}>
      <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
        <p className='font-mono text-lg font-semibold tracking-wider'>{gift.code}</p>
        <p className={`justify-self-start rounded-sm border px-2 py-0.5 text-sm font-semibold ${STATUS_TONES[gift.status] || 'tone-muted'}`}>
          {giftStatusWords(gift.status)}
        </p>
      </div>
      <p>{giftWords(gift)}</p>
      <dl className='grid gap-1 text-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4'>
        <dt className='font-semibold'>Bought by</dt>
        <dd>
          <Person who={gift.buyer} />
          {gift.toName ? `, for ${gift.toName}` : ''}
        </dd>
        <dt className='font-semibold'>Paid</dt>
        <dd>{whenWords(gift.paidAt) || 'Not paid'}</dd>
        {gift.redeemedAt ? (
          <>
            <dt className='font-semibold'>Redeemed by</dt>
            <dd>
              <Person who={gift.redeemedBy} />, {whenWords(gift.redeemedAt)}
              {gift.grant ? `; the plan runs until ${whenWords(gift.grant.endsAt)}` : ''}
            </dd>
          </>
        ) : null}
        {gift.refundedAt ? (
          <>
            <dt className='font-semibold'>Refunded</dt>
            <dd>{whenWords(gift.refundedAt)}</dd>
          </>
        ) : null}
      </dl>
    </article>
  );
}

export default GiftAdminItem;
