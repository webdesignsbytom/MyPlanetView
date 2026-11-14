import React, { useState } from 'react';
// Components
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import Button from '@/components/common/Button';
// Utils
import { SHARE_ROLE_OPTIONS } from '@/utils/sharing/shareRoles';

// "Add people": an email and a role. Someone with an account gets access straight away;
// anyone else is emailed an invite.
function ShareAddPersonForm({ onAdd }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await onAdd({ email: email.trim().toLowerCase(), role });
      setEmail('');
    } catch {
      // The dialog shows the message
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end' noValidate>
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
      <PlainOptionSelect id='share-role' value={role} onChange={(e) => setRole(e.target.value)} options={SHARE_ROLE_OPTIONS} ariaLabel='Role' />
      <Button type='submit' busy={busy} disabled={!email.trim()}>
        Share
      </Button>
    </form>
  );
}

export default ShareAddPersonForm;
