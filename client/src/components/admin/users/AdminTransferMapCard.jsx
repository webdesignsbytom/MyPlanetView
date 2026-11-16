import React, { useState } from 'react';
// Api
import { adminTransferMap } from '@/api/plansApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import CheckboxInput from '@/components/ui/CheckboxInput';
import ConfirmModal from '@/components/modals/ConfirmModal';
// Utils
import { isValidEmail } from '@/utils/regex/regex';
import { formatDay } from '@/utils/functions/dates';

// Moving a map to another account when its owner can't (a death, a lost address), after
// checking off the site (docs/API.md, "Transferring a map"). The new owner needs an
// active account, not necessarily on the map. The old owner stays as an editor only if
// ticked. The new owner gets 60 days' grace when they have no free map slot.
function AdminTransferMapCard() {
  const [mapId, setMapId] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [keepOldOwner, setKeepOldOwner] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    setDone(null);
    const next = {};
    if (!mapId.trim()) next.mapId = 'Enter the map’s id (from its address: /maps/<id>).';
    if (!isValidEmail(toEmail.trim())) next.toEmail = 'Enter the new owner’s email address.';
    setErrors(next);
    if (!Object.keys(next).length) setConfirming(true);
  };

  const transfer = async () => {
    setBusy(true);
    try {
      const { map } = await adminTransferMap({ mapId: mapId.trim(), toEmail: toEmail.trim().toLowerCase(), keepOldOwnerAsEditor: keepOldOwner });
      setDone(
        `“${map.name}” now belongs to ${toEmail.trim()}.${
          map.graceUntil ? ` They have no free map slot, so it’s fully usable until ${formatDay(map.graceUntil)}, then needs paying for.` : ''
        }`,
      );
      setMapId('');
      setToEmail('');
      setKeepOldOwner(false);
    } catch (err) {
      setError(err.friendlyMessage || 'The map couldn’t be moved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PaperCard title='Transfer a map' titleId='admin-transfer-map-heading' className='paper-fields'>
      <p className='text-sm'>
        For an owner who can’t hand their map over themselves. Check who you’re dealing with off the site first: the
        new owner gets everything on the map.
      </p>
      <form className='grid gap-3' onSubmit={submit} noValidate>
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField id='transfer-map-id' label='Map id' error={errors.mapId} required>
            <TextInput value={mapId} onChange={(e) => setMapId(e.target.value)} autoComplete='off' spellCheck={false} />
          </FormField>
          <FormField id='transfer-map-email' label='New owner’s email' error={errors.toEmail} required>
            <TextInput type='email' value={toEmail} onChange={(e) => setToEmail(e.target.value)} autoComplete='off' />
          </FormField>
        </div>
        <CheckboxInput
          id='transfer-map-keep'
          checked={keepOldOwner}
          onChange={(e) => setKeepOldOwner(e.target.checked)}
          label='Keep the old owner on the map as an editor'
        />
        <InlineAlert>{error}</InlineAlert>
        {done ? <InlineAlert tone='good'>{done}</InlineAlert> : null}
        <div className='grid justify-end'>
          <Button type='submit' busy={busy}>
            Transfer map
          </Button>
        </div>
      </form>

      {confirming ? (
        <ConfirmModal
          header='Transfer this map?'
          message={`The map ${mapId.trim()} will belong to ${toEmail.trim()}, with its owner’s plan.${keepOldOwner ? ' The old owner stays as an editor.' : ' The old owner loses access.'}`}
          onConfirm={transfer}
          onClose={() => setConfirming(false)}
        />
      ) : null}
    </PaperCard>
  );
}

export default AdminTransferMapCard;
