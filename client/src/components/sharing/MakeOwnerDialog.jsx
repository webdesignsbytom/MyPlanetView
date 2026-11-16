import React, { useState } from 'react';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import CheckboxInput from '@/components/ui/CheckboxInput';

// Asking before a map changes hands (POST /maps/:mapId/transfer): the new owner's plan
// decides the map's limits from then on, and only they can share or delete it. "Stay on
// the map as an editor" starts ticked. `onConfirm(stayAsEditor)` returns a promise; a
// refusal is shown here. Opened from the share dialog (useModalA11y keeps Escape here).
function MakeOwnerDialog({ member, mapName, onConfirm, onClose }) {
  const [stay, setStay] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const who = member.name || member.email;

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(stay);
    } catch (err) {
      setError(err.friendlyMessage || 'The map couldn’t be handed over.');
      setBusy(false);
    }
  };

  return (
    <Modal title={`Make ${who} the owner?`} onClose={onClose}>
      <p>
        {who} will own “{mapName}”. Their plan decides its limits from now on, and only they can share it, hand it on or
        delete it.
      </p>
      <CheckboxInput
        id='make-owner-stay'
        checked={stay}
        onChange={(e) => setStay(e.target.checked)}
        label='Stay on the map as an editor'
      />
      {stay ? null : <p className='text-sm opacity-80'>You’ll lose access to the map unless they add you again.</p>}
      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onClose}>
          Cancel
        </Button>
        <Button busy={busy} onClick={confirm}>
          Make owner
        </Button>
      </div>
    </Modal>
  );
}

export default MakeOwnerDialog;
