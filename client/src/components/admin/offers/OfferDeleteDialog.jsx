import React, { useState } from 'react';
// Api
import { deleteOffer } from '@/api/offerAdminApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { clicksWord } from '@/utils/offers/offerAdmin';

// Deleting an offer, after saying what goes with it: every click counted for it. Turning
// it off instead keeps them. `onDeleted(offer)` once it's gone.
function OfferDeleteDialog({ offer, onDeleted, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const recent = offer.clicks?.total ?? 0;

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteOffer(offer.id);
      onDeleted(offer);
    } catch (err) {
      setError(err.friendlyMessage || 'The offer couldn’t be deleted.');
      setBusy(false);
    }
  };

  return (
    <Modal title={`Delete ${offer.title}?`} onClose={onClose}>
      <p className='text-sm'>
        This deletes the offer and its click counts: {clicksWord(recent)} in the last 30 days, and every day before. It can’t be undone.
      </p>
      <p className='text-sm'>To stop showing it but keep its counts, turn it off instead.</p>
      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onClose}>
          Cancel
        </Button>
        <Button danger busy={busy} onClick={confirm}>
          Delete offer and counts
        </Button>
      </div>
    </Modal>
  );
}

export default OfferDeleteDialog;
