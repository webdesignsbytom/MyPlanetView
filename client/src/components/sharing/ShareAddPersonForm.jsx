import React, { useState } from 'react';
// Components
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import Button from '@/components/common/Button';
// Utils
import { SHARE_ROLE_OPTIONS } from '@/utils/sharing/shareRoles';

// "Add people": an email and a role. Someone with an account gets access straight away;
// anyone else is emailed an invite. On a map, `roleOptions` adds Co-owner, and `coOwner`
// (`{ options, room }`, utils/sharing/shareRoles.js coOwnerChoices) the travellers a co-owner
// could be: choosing Co-owner asks which one (19 Nov 2026). Re-adding someone already on the
// map as a co-owner is how an editor or viewer becomes one.
function ShareAddPersonForm({ onAdd, roleOptions = SHARE_ROLE_OPTIONS, coOwner = null }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [travellerId, setTravellerId] = useState('');
  const [busy, setBusy] = useState(false);

  const asCoOwner = role === 'CO_OWNER';
  const coOwnerOptions = coOwner?.options || [];
  const noRoom = asCoOwner && (!coOwner?.room || !coOwnerOptions.length);
  // The first free traveller until one is chosen
  const chosenTraveller = coOwnerOptions.some((o) => o.value === travellerId) ? travellerId : coOwnerOptions[0]?.value || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || noRoom) return;
    setBusy(true);
    try {
      await onAdd({ email: email.trim().toLowerCase(), role, ...(asCoOwner ? { travellerId: chosenTraveller } : {}) });
      setEmail('');
    } catch {
      // The dialog shows the message
    } finally {
      setBusy(false);
    }
  };

  return (
    // The same columns as the "People with access" rows (ACCESS_ROW_CLASS), so the role
    // dropdowns line up down the dialog; the row's items stretch, so the input, the
    // dropdown and the button are all the same height
    <form onSubmit={handleSubmit} className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_6rem]' noValidate>
      <label htmlFor='share-email' className='sr-only'>
        Email address
      </label>
      <TextInput
        id='share-email'
        type='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder='Add people by email'
        autoComplete='off'
        inputMode='email'
      />
      <PlainOptionSelect id='share-role' value={role} onChange={(e) => setRole(e.target.value)} options={roleOptions} ariaLabel='Role' />
      <Button type='submit' busy={busy} disabled={!email.trim() || noRoom}>
        Share
      </Button>
      {asCoOwner ? (
        <div className='grid gap-1 text-sm sm:col-span-3'>
          {noRoom ? (
            <p role='status'>
              A co-owner is one of the map’s travellers with their own login, and every traveller here has one, or the
              map has no room for another. Add a traveller in Settings first.
            </p>
          ) : (
            <>
              <label htmlFor='share-traveller' className='font-medium'>
                Which traveller is this?
              </label>
              <PlainOptionSelect
                id='share-traveller'
                value={chosenTraveller}
                onChange={(e) => setTravellerId(e.target.value)}
                options={coOwnerOptions}
                ariaLabel='Which traveller is this?'
              />
              <p className='text-xs opacity-80'>
                A co-owner can change everything on this map, its settings and who it’s shared with, but can’t delete it.
              </p>
            </>
          )}
        </div>
      ) : null}
    </form>
  );
}

export default ShareAddPersonForm;
