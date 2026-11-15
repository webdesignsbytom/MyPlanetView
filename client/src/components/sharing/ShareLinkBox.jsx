import React, { useState } from 'react';
// Components
import Button from '@/components/common/Button';

// The share link and its code, with copy, and "reset link" (a new code; old links stop
// working), offered only when `canReset` (a verified email address).
function ShareLinkBox({ shareUrl, shareCode, busy, canReset = true, onReset }) {
  const [copied, setCopied] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className='grid gap-2'>
      {/* Items stretch: the link box and Copy link are the same height */}
      <div className='grid gap-2 sm:grid-cols-rev'>
        <input
          readOnly
          value={shareUrl}
          aria-label='Share link'
          onFocus={(e) => e.target.select()}
          className='w-full truncate border border-field-edge bg-field px-2 py-2 text-sm'
        />
        <Button quiet onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
      <p className='text-xs opacity-80'>
        Share code <span className='font-mono font-semibold'>{shareCode}</span>
      </p>
      {!canReset ? null : confirmingReset ? (
        <div className='grid gap-2 rounded-lg border px-3 py-2 text-sm tone-warn'>
          <p>Make a new link? Anyone using the old one loses access, unless they were added by email.</p>
          <div className='grid grid-row gap-2'>
            <Button
              danger
              busy={busy}
              onClick={async () => {
                await onReset();
                setConfirmingReset(false);
              }}
            >
              Reset link
            </Button>
            <Button quiet onClick={() => setConfirmingReset(false)}>
              Keep this one
            </Button>
          </div>
        </div>
      ) : (
        <button type='button' onClick={() => setConfirmingReset(true)} className='justify-self-start text-xs underline underline-offset-2'>
          Reset link
        </button>
      )}
    </div>
  );
}

export default ShareLinkBox;
