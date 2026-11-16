import React, { useState } from 'react';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';

/**
 * Asking before someone loses access, from the share dialog's bins (the user's wish, 16 Nov
 * 2026): a member taken off (`member`), or an invite cancelled (`invite`). `kind` is 'map'
 * or 'trip', `name` the map's or trip's. `onConfirm()` returns a promise; a refusal is shown
 * here, and the share dialog closes this once it's done. Opened over the share dialog
 * (useModalA11y gives Escape to this one first).
 */
function RemoveAccessDialog({ member = null, invite = null, kind, name, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const who = member ? member.name || member.email : invite?.email;

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
      setBusy(false);
    }
  };

  return (
    <Modal title={member ? `Remove ${who}?` : 'Cancel the invite?'} onClose={onClose}>
      <p>
        {member
          ? `${who} will no longer be able to open “${name}”. You can add them again at any time.`
          : `The invite to ${who} will stop working, so the link in their email won’t open this ${kind}. You can invite them again at any time.`}
      </p>
      <InlineAlert>{error}</InlineAlert>
      <div className='grid gap-2 sm:grid-row sm:justify-end'>
        <Button quiet onClick={onClose}>
          {member ? 'Keep them' : 'Keep the invite'}
        </Button>
        <Button danger busy={busy} onClick={confirm}>
          {member ? 'Remove' : 'Cancel the invite'}
        </Button>
      </div>
    </Modal>
  );
}

export default RemoveAccessDialog;
