import React, { useState } from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { postcardLink } from '@/utils/postcards/postcardRules';

/**
 * A postcard's link (docs/API.md "Postcards"): the address to copy, "Copy the link", "Share" where
 * the browser has a share sheet (a phone), and "Open it" in a new tab, each named for the card
 * (`name`: "your postcard to Gran"). In the maker once it's sent, and in the account's list.
 */
function PostcardLinkBox({ postcard, name = 'your postcard' }) {
  const [note, setNote] = useState('');
  const link = postcardLink(window.location.origin, postcard.code);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote('Copied: paste it to whoever the card is for.');
    } catch {
      setNote('It couldn’t be copied here: select the link and copy it yourself.');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: 'A postcard for you', url: link });
    } catch {
      // The share sheet closed: nothing to say
    }
  };

  return (
    <div className='grid gap-2'>
      <input
        readOnly
        value={link}
        aria-label={`Link to ${name}`}
        onFocus={(e) => e.target.select()}
        className='w-full truncate border border-field-edge bg-field px-2 py-2 text-sm'
        data-postcard-link=''
      />
      <div className={`grid gap-2 ${canShare ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <Button quiet onClick={copy} ariaLabel={`Copy the link to ${name}`}>
          Copy the link
        </Button>
        {canShare ? (
          <Button quiet onClick={share} ariaLabel={`Share ${name}`}>
            Share
          </Button>
        ) : null}
        <a href={link} target='_blank' rel='noopener noreferrer' className='btn-paper text-center' aria-label={`Open ${name} (opens in a new tab)`}>
          Open it
        </a>
      </div>
      <p className='text-sm' aria-live='polite'>
        {note}
      </p>
    </div>
  );
}

export default PostcardLinkBox;
