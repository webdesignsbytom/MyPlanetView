import React, { useState } from 'react';
// Api
import { updatePromoCode } from '@/api/promoApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import PromoCodeFields from './PromoCodeFields';
// Utils
import { promoBodyFrom, promoFormFrom } from '@/utils/plans/promoCodeForm';

// Changing a code's label and limits (the code itself never changes: it's in people's
// posts). Accounts that already signed up keep their free month.
// `onSaved` gets the code as the server answers it (without counts).
function PromoCodeEditDialog({ promo, onSaved, onClose }) {
  const [form, setForm] = useState(() => promoFormFrom(promo));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const parsed = promoBodyFrom(form, { existing: promo });
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) return;

    setBusy(true);
    try {
      const { promoCode } = await updatePromoCode(promo.id, parsed.body);
      onSaved(promoCode);
    } catch (err) {
      setError(err.friendlyMessage || 'The code couldn’t be changed.');
      setBusy(false);
    }
  };

  return (
    <Modal title={`Change ${promo.code}`} onClose={onClose}>
      <form className='grid gap-3' onSubmit={submit} noValidate>
        <p className='text-sm'>People who already signed up with it keep their free month.</p>
        <PromoCodeFields idPrefix='edit-promo' form={form} errors={errors} onChange={change} />
        <InlineAlert>{error}</InlineAlert>
        <div className='grid grid-row justify-end gap-2'>
          <Button quiet onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit' busy={busy}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default PromoCodeEditDialog;
