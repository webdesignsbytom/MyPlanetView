import React, { useRef, useState } from 'react';
// Api
import { createOffer, updateOffer } from '@/api/offerAdminApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import OfferFields from './OfferFields';
import OfferCardPreview from './OfferCardPreview';
// Utils
import { countryName } from '@/utils/map/countries';
import { checkOfferUrl, fillOfferUrl } from '@/utils/offers/offerRules';
import { emptyOfferForm, offerBodyFrom, offerFormFrom, previewOfferFrom } from '@/utils/offers/offerForm';

// Where a click on this link would go for a planned trip (an example: the real values
// come from the trip or the page the card is on)
function exampleClick(form) {
  const url = String(form.url).trim();
  if (!checkOfferUrl(url)) return null;
  const country = form.countryCode || 'JP';
  return fillOfferUrl(url, {
    destination: form.countryCode ? countryName(form.countryCode) : 'Kyoto',
    country,
    checkin: '2027-04-02',
    checkout: '2027-04-09',
  });
}

// A new offer (`offer` null) or a change to one (its key never changes), with a sketch of
// its card beside the form. `onSaved(offer, { created })` gets the offer as the server
// answers it (without clicks).
function OfferEditDialog({ offer = null, onSaved, onClose }) {
  const creating = !offer;
  const [form, setForm] = useState(() => (offer ? offerFormFrom(offer) : emptyOfferForm()));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const formRef = useRef(null);
  const click = exampleClick(form);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const parsed = offerBodyFrom(form, { existing: offer });
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) {
      setError('Check the fields marked above.');
      // The first wrong field, once it's marked
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }

    setBusy(true);
    try {
      const saved = creating ? await createOffer(parsed.body) : await updateOffer(offer.id, parsed.body);
      onSaved(saved.offer, { created: creating });
    } catch (err) {
      setError(err.friendlyMessage || (creating ? 'The offer couldn’t be made.' : 'The offer couldn’t be changed.'));
      setBusy(false);
    }
  };

  // The fields, then (beside them on a wide screen, below on a phone) the card's sketch,
  // then the buttons
  return (
    <Modal title={creating ? 'New offer' : `Change ${offer.title}`} onClose={onClose} wide>
      <form ref={formRef} className='grid gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start' onSubmit={submit} noValidate>
        <div className='grid min-w-0 gap-3 lg:col-start-1'>
          <OfferFields idPrefix={creating ? 'new-offer' : 'edit-offer'} form={form} errors={errors} onChange={change} existingKey={offer?.key} />
        </div>

        <aside className='grid min-w-0 content-start gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1' aria-label='Preview'>
          <OfferCardPreview offer={previewOfferFrom(form)} placements={form.placements} />
          {click ? (
            <p className='break-all text-xs'>
              <span className='font-semibold'>A click from a trip to {form.countryCode ? countryName(form.countryCode) : 'Kyoto'}, 2 to 9 April 2027, goes to:</span>{' '}
              {click}
            </p>
          ) : null}
        </aside>

        <div className='grid min-w-0 gap-3 lg:col-start-1'>
          <InlineAlert>{error}</InlineAlert>
          <div className='grid grid-row justify-end gap-2'>
            <Button quiet onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' busy={busy}>
              {creating ? 'Make offer' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default OfferEditDialog;
