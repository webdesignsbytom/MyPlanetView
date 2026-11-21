import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
// Utils
import { giftPath } from '@/utils/constants/routes';
import { GIFT_STATUS_WORDS, giftTitle } from '@/utils/gifts/giftWords';
import { formatDay } from '@/utils/functions/dates';

// The gifts you've bought (docs/API.md "Gifts"), newest first: each code, who it's for, where
// it stands, and its page (to print or send on), with its link to copy.
function GiftListCard({ gifts }) {
  const uid = useId();
  const [copied, setCopied] = useState('');

  const copy = async (gift) => {
    const link = `${window.location.origin}${giftPath(gift.code)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(gift.id);
    } catch {
      setCopied('');
    }
  };

  return (
    <PaperCard title='Your gifts' titleId={`${uid}-title`}>
      {gifts.length ? (
        <ul className='grid divide-y divide-dashed divide-poster-brown/50' aria-labelledby={`${uid}-title`}>
          {gifts.map((gift) => (
            <li key={gift.id} className='grid gap-2 py-3' data-gift-code={gift.code}>
              <div className='grid gap-0.5'>
                <span className='font-semibold'>
                  {giftTitle(gift)}
                  {gift.toName ? ` for ${gift.toName}` : ''}
                </span>
                <span className='font-mono text-lg tracking-widest'>{gift.code}</span>
                <span className='text-sm opacity-80'>
                  {GIFT_STATUS_WORDS[gift.status] ?? gift.status}
                  {gift.paidAt ? ` · bought ${formatDay(gift.paidAt)}` : ''}
                  {gift.redeemedAt ? ` · redeemed ${formatDay(gift.redeemedAt)}` : ''}
                </span>
              </div>
              {gift.status === 'READY' ? (
                <div className='grid gap-2 sm:grid-cols-2'>
                  <Link to={giftPath(gift.code)} className='btn-paper text-center'>
                    Open the gift
                  </Link>
                  <Button quiet onClick={() => copy(gift)} ariaLabel={`Copy the link to the gift ${gift.code}`}>
                    {copied === gift.id ? 'Link copied' : 'Copy the link'}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>None yet. Gifts you buy show here, with their codes.</p>
      )}
    </PaperCard>
  );
}

export default GiftListCard;
