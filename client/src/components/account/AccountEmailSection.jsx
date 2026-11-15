import React, { useRef, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import ChangeEmailForm from '@/components/forms/ChangeEmailForm';
import FormAlert from '@/components/forms/FormAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

function AccountEmailSection() {
  const { user, resendVerificationEmail } = useAuth();

  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState({ message: '', variant: 'error' });
  const alertRef = useRef(null);

  const onResend = async () => {
    setSending(true);
    const result = await resendVerificationEmail();
    setSending(false);
    setAlert(
      result.ok
        ? { message: `Verification email sent to ${user.email}.`, variant: 'success' }
        : { message: result.error, variant: 'error' },
    );
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  return (
    <div className='grid gap-6'>
      {/* Verification status */}
      {user?.emailVerified ? (
        <p className='text-sm text-center text-status-good font-semibold'>
          Your email address is verified.
        </p>
      ) : (
        <div className='grid gap-3 justify-items-center text-center'>
          <p className='text-sm'>
            Your email address isn&apos;t verified yet. Check your inbox for the link,
            or send a new one.
          </p>
          <button
            type='button'
            className='btn-poster'
            onClick={onResend}
            disabled={sending}
          >
            {sending ? <LoadingSpinner xs /> : 'Resend verification email'}
          </button>
          <FormAlert innerRef={alertRef} message={alert.message} variant={alert.variant} />
        </div>
      )}

      <ChangeEmailForm />
    </div>
  );
}

export default AccountEmailSection;
