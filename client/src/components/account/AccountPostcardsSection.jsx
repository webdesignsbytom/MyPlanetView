import React, { useCallback, useEffect, useState } from 'react';
// Api
import { deletePostcard, getMyPostcards, resetPostcardLink } from '@/api/postcardsApi';
// Hooks
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Components
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PostcardLinkBox from '@/components/postcards/PostcardLinkBox';
// Utils
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { postcardTitle, sentOnWords } from '@/utils/postcards/postcardRules';

const titleOf = (card) => postcardTitle(COUNTRY_BY_CODE[card.countryCode]?.name ?? card.countryCode, card.kind === 'LANDMARK' ? card.landmark?.name : null);

// One card sent: what it is, its link, and a new link or deleting it, each asked first
function PostcardRow({ card, locked, onChanged, onDeleted }) {
  const [asking, setAsking] = useState(null); // 'reset' | 'delete'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const name = card.toName ? `your postcard to ${card.toName}` : 'your postcard';

  const run = async (work, done) => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      await work();
      done?.();
    } catch (err) {
      setError(err?.friendlyMessage || 'That didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const relink = () =>
    run(
      async () => onChanged((await resetPostcardLink(card.id)).postcard),
      () => {
        setAsking(null);
        setNote('A new link is ready. The old one no longer works.');
      },
    );
  const remove = () =>
    run(async () => {
      await deletePostcard(card.id);
      onDeleted(card.id);
    });

  return (
    <li className='grid gap-2 border-b border-dashed border-poster-brown/40 pb-4' data-postcard-row={card.id}>
      <p className='grid'>
        <span className='font-semibold'>{titleOf(card)}</span>
        <span className='text-xs'>{[card.toName ? `To ${card.toName}` : null, `sent ${sentOnWords(card.sentAt)}`].filter(Boolean).join(' · ')}</span>
      </p>
      <PostcardLinkBox postcard={card} name={name} />
      {asking ? (
        <div className='grid gap-2 rounded-lg border px-3 py-2 text-sm tone-warn' role='group' aria-label={asking === 'reset' ? 'Make a new link?' : 'Delete this postcard?'}>
          <p>
            {asking === 'reset'
              ? 'Make a new link? Anyone using the old one won’t be able to open the card any more.'
              : 'Delete this postcard? Its link stops working. Anyone who downloaded it keeps their copy.'}
          </p>
          <div className='grid grid-row gap-2'>
            <Button danger busy={busy} onClick={asking === 'reset' ? relink : remove}>
              {asking === 'reset' ? 'Make a new link' : 'Delete it'}
            </Button>
            <Button quiet onClick={() => setAsking(null)}>
              Keep it as it is
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid grid-row justify-start gap-4 text-sm'>
          <button
            type='button'
            disabled={locked}
            onClick={() => setAsking('reset')}
            aria-label={`New link for ${name}`}
            className='underline underline-offset-2 disabled:opacity-50'
          >
            New link
          </button>
          <button type='button' disabled={locked} onClick={() => setAsking('delete')} aria-label={`Delete ${name}`} className='underline underline-offset-2 disabled:opacity-50'>
            Delete
          </button>
        </div>
      )}
      <InlineAlert>{error}</InlineAlert>
      {note ? (
        <p role='status' className='text-sm'>
          {note}
        </p>
      ) : null}
    </li>
  );
}

/**
 * The account page's postcards (26 Nov 2026; docs/API.md "Postcards"): every card the person sent,
 * newest first, each with its link to copy, share or open, a new link (the old one stops working)
 * and deleting it. They're sent from a place's ticket on the map ("Send a postcard") and are never
 * part of a map. An unverified address can't change them (the server refuses).
 */
function AccountPostcardsSection() {
  const locked = useMustVerifyEmail();
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getMyPostcards()
      .then((reply) => setCards(reply.postcards || []))
      .catch((err) => setError(err?.friendlyMessage || 'Your postcards couldn’t be loaded.'));
  }, []);
  useEffect(load, [load]);

  const changed = (card) => setCards((list) => list.map((c) => (c.id === card.id ? card : c)));
  const deleted = (id) => setCards((list) => list.filter((c) => c.id !== id));

  if (error) return <InlineAlert>{error}</InlineAlert>;
  if (!cards) {
    return (
      <div className='grid place-items-center py-2' role='status'>
        <LoadingSpinner />
        <span className='sr-only'>Loading your postcards…</span>
      </div>
    );
  }
  return (
    <div className='grid gap-4' data-account-postcards={cards.length}>
      {cards.length ? (
        <ul className='grid gap-4'>
          {cards.map((card) => (
            <PostcardRow key={card.id} card={card} locked={locked} onChanged={changed} onDeleted={deleted} />
          ))}
        </ul>
      ) : (
        <p className='text-sm'>
          You haven’t sent a postcard yet. Open a country on your map and press “Send a postcard”: it goes by a link of its own, and isn’t part of your map.
        </p>
      )}
    </div>
  );
}

export default AccountPostcardsSection;
