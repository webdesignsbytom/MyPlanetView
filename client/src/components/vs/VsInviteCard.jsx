import React, { useMemo, useState } from 'react';
// Api
import { resetVsLink } from '@/api/vsApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { vsJoinLink } from '@/utils/vs/vsWords';

/**
 * Bringing friends in (26 Nov 2026): the comparison's join link to copy or share, how many are in
 * of the 8 it can have, and for the starter (`canReset`) a new link, the old one stopping.
 */
function VsInviteCard({ group, canReset = false, onChanged }) {
  const link = useMemo(() => vsJoinLink(window.location.origin, group.joinCode), [group.joinCode]);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const full = group.members.length >= group.memberLimit;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote('Copied: send it to the friends you want to compare with.');
    } catch {
      setNote('It couldn’t be copied here: select the link and copy it yourself.');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: group.title, text: 'Compare our travels with me on My Planet View', url: link });
    } catch {
      // The share sheet closed: nothing to say
    }
  };
  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      const { group: updated } = await resetVsLink(group.id);
      onChanged(updated);
      setConfirming(false);
    } catch (err) {
      setError(err.friendlyMessage || 'A new link couldn’t be made.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PaperCard title='Bring your friends' titleId='vs-invite-heading'>
      <p className='text-sm' data-vs-count={group.members.length}>
        {full
          ? `${group.memberLimit} people are in, the most a comparison can have.`
          : `${group.members.length} of ${group.memberLimit} in. Send this link to the friends you want to compare with: they sign in, pick the map that counts for them, and they’re in. Everyone sees names and numbers, never a map or photos.`}
      </p>
      <input
        readOnly
        value={link}
        aria-label='Join link'
        onFocus={(e) => e.target.select()}
        className='w-full truncate border border-field-edge bg-field px-2 py-2 text-sm'
      />
      <div className={`grid gap-2 ${canShare ? 'sm:grid-cols-2' : ''}`}>
        <Button quiet onClick={copy}>
          Copy link
        </Button>
        {canShare ? (
          <Button quiet onClick={share}>
            Share
          </Button>
        ) : null}
      </div>
      <p className='text-sm' aria-live='polite'>
        {note}
      </p>
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

export default VsInviteCard;
