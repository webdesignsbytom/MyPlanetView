import React, { useMemo, useState } from 'react';
// Api
import { resetChallengeLink } from '@/api/challengesApi';
// Constants
import { challengeJoinPath } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';

// Inviting friends: the challenge's join link to copy and send however you like. Anyone
// with it can see the title, dates and who started it, and join once signed in. The
// starter can make a new link (`canReset`); the old one then stops working.
function ChallengeInviteCard({ challenge, canReset = false, onChanged }) {
  const link = useMemo(() => `${window.location.origin}${challengeJoinPath(challenge.joinCode)}`, [challenge.joinCode]);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const full = challenge.members.length >= challenge.memberLimit;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      const { challenge: updated } = await resetChallengeLink(challenge.id);
      onChanged(updated);
      setConfirming(false);
    } catch (err) {
      setError(err.friendlyMessage || 'A new link couldn’t be made.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PaperCard title='Invite friends' titleId='challenge-invite-heading'>
      <p className='text-sm'>
        {full
          ? `This challenge has ${challenge.memberLimit} people, the most it can have.`
          : 'Send this link to the people you want to race. They sign in (or sign up), pick the map that counts for them, and they’re in. They’ll see names and counts, never your map or photos.'}
      </p>
      <div className='grid gap-2 sm:grid-cols-rev'>
        <input
          readOnly
          value={link}
          aria-label='Join link'
          onFocus={(e) => e.target.select()}
          className='w-full truncate border border-field-edge bg-field px-2 py-2 text-sm'
        />
        <Button quiet onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
      <InlineAlert>{error}</InlineAlert>
      {!canReset ? null : confirming ? (
        <div className='grid gap-2 rounded-lg border px-3 py-2 text-sm tone-warn'>
          <p>Make a new link? The old one stops working. Everyone already in stays in.</p>
          <div className='grid grid-row gap-2'>
            <Button danger busy={busy} onClick={reset}>
              Make a new link
            </Button>
            <Button quiet onClick={() => setConfirming(false)}>
              Keep this one
            </Button>
          </div>
        </div>
      ) : (
        <button type='button' onClick={() => setConfirming(true)} className='justify-self-start text-xs underline underline-offset-2'>
          Make a new link
        </button>
      )}
    </PaperCard>
  );
}

export default ChallengeInviteCard;
