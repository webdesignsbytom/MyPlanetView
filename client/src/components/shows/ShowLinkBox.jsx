import React, { useState } from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { showLink } from '@/utils/shows/showRules';

/**
 * A slideshow's link (docs/API.md "Photo slideshows"): the address to copy, "Copy the link",
 * "Share" where the browser has a share sheet (a phone), and "Open it" in a new tab, each named
 * for the show (the share dialog also has the map's own "Copy link", and lists several shows).
 * In the maker once it's made, and on each of the map's shows in the share dialog.
 */
function ShowLinkBox({ show }) {
  const [note, setNote] = useState('');
  const link = showLink(window.location.origin, show.code);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote('Copied: paste it to whoever you like.');
    } catch {
      setNote('It couldn’t be copied here: select the link and copy it yourself.');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: show.title, url: link });
    } catch {
      // The share sheet closed: nothing to say
    }
  };

  return (
    <div className='grid gap-2'>
      <input
        readOnly
        value={link}
        aria-label={`Link to ${show.title}`}
        onFocus={(e) => e.target.select()}
        className='w-full truncate border border-field-edge bg-field px-2 py-2 text-sm'
      />
      <div className={`grid gap-2 ${canShare ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <Button quiet onClick={copy} ariaLabel={`Copy the link to ${show.title}`}>
          Copy the link
        </Button>
        {canShare ? (
          <Button quiet onClick={share} ariaLabel={`Share ${show.title}`}>
            Share
          </Button>
        ) : null}
        <a href={link} target='_blank' rel='noopener noreferrer' className='btn-paper text-center' aria-label={`Open ${show.title} (opens in a new tab)`}>
          Open it
        </a>
      </div>
      <p className='text-sm' aria-live='polite'>
        {note}
      </p>
    </div>
  );
}

export default ShowLinkBox;
