import React, { useRef, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import FormAlert from '@/components/forms/FormAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

function AccountSessionsSection() {
  const { revokeOtherSessions, logout } = useAuth();

  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [alert, setAlert] = useState({ message: '', variant: 'error' });
  const alertRef = useRef(null);

  // Success leaves the page; a failure says they're still logged in
  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setAlert({ message: '', variant: 'error' });
    const result = await logout();
    if (result.ok) return;
    setLoggingOut(false);
    setAlert({ message: result.error, variant: 'error' });
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  const onRevoke = async () => {
    setBusy(true);
    const result = await revokeOtherSessions();
    setBusy(false);
    setAlert(
      result.ok
        ? { message: "You've been signed out everywhere else.", variant: 'success' }
        : { message: result.error, variant: 'error' },
    );
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  return (
    <div className='grid gap-4 justify-items-center text-center'>
      <p className='text-sm'>
        Signed in on a shared or lost device? Sign out of every other browser and
        device.
      </p>
      <div className='flex flex-wrap justify-center gap-3'>
        <button
          type='button'
          className='py-2 px-4 bg-colour6 cursor-pointer text-colour1 shadow-lift-sm rounded-md hover:brightness-110 active:scale-95 disabled:opacity-60'
          onClick={onRevoke}
          disabled={busy}
        >
          {busy ? <LoadingSpinner xs /> : 'Sign out other devices'}
        </button>
        <button
          type='button'
          className='py-2 px-4 rounded-md border-2 border-solid border-colour6 hover:brightness-110'
          onClick={onLogout}
          aria-busy={loggingOut}
        >
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
      <FormAlert innerRef={alertRef} message={alert.message} variant={alert.variant} />
    </div>
  );
}

export default AccountSessionsSection;
