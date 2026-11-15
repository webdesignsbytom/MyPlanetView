import React, { useRef, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import FormField from '@/components/ui/FormField';
import FormAlert from '@/components/forms/FormAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import TextInput from '@/components/ui/TextInput';
// Utils
import { EMAIL_MAX_LENGTH, isValidEmail } from '@/utils/regex/regex';

function ChangeEmailForm() {
  const { user, changeEmail } = useAuth();
  // better-auth emails a verified account's current address before the new one
  const confirmsFromCurrent = Boolean(user?.emailVerified);

  const [newEmail, setNewEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [alert, setAlert] = useState({ message: '', variant: 'error' });

  const emailRef = useRef(null);
  const alertRef = useRef(null);

  const validate = (email) => {
    if (!email) return 'Enter your new email address.';
    if (!isValidEmail(email)) return 'Enter a valid email address.';
    if (email === String(user?.email || '').toLowerCase()) {
      return 'That is already your email address.';
    }
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setAlert({ message: '', variant: 'error' });

    const email = newEmail.trim().toLowerCase();
    const error = validate(email);
    setFieldError(error);
    if (error) {
      emailRef.current?.focus();
      return;
    }

    setInProgress(true);
    const result = await changeEmail({ newEmail: email });
    setInProgress(false);

    if (result.ok) {
      setNewEmail('');
      // A verified address confirms the change first (the server emails it), then the new
      // one. When another account already uses the new address, the server answers the
      // same and sends nothing (so the answer doesn't tell), so this can't promise an email.
      setAlert({
        message: confirmsFromCurrent
          ? `If no other account uses ${email}, we've sent a link to ${user.email} to confirm the change. After that, we'll email a link to ${email}; your email changes once you click it.`
          : `If no other account uses ${email}, we've sent a link to it. Your email changes once you click it.`,
        variant: 'success',
      });
    } else {
      setAlert({ message: result.error, variant: 'error' });
    }
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  return (
    <form
      className='grid gap-y-4'
      onSubmit={onSubmit}
      aria-busy={inProgress ? 'true' : 'false'}
      noValidate
    >
      <p className='text-sm text-center'>
        Current email: <span className='font-semibold'>{user?.email}</span>
      </p>

      <FormField
        id='newEmail'
        label='New email address'
        hint={
          confirmsFromCurrent
            ? "We'll ask you to confirm from your current address first, then from the new one."
            : "We'll send a link to the new address to confirm it."
        }
        error={fieldError}
        required
      >
        <TextInput
          refProp={emailRef}
          type='email'
          name='newEmail'
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setFieldError('');
            setAlert({ message: '', variant: 'error' });
          }}
          required
          maxLength={EMAIL_MAX_LENGTH}
          autoComplete='email'
          inputMode='email'
          autoCapitalize='none'
          spellCheck={false}
        />
      </FormField>

      <button
        type='submit'
        className='btn-poster'
        disabled={inProgress}
      >
        {inProgress ? (
          <span className='grid grid-row place-content-center items-center gap-2' aria-live='polite'>
            <LoadingSpinner xs />
            <span className='sr-only'>Sending confirmation…</span>
          </span>
        ) : (
          'Change email'
        )}
      </button>

      <FormAlert innerRef={alertRef} message={alert.message} variant={alert.variant} />
    </form>
  );
}

export default ChangeEmailForm;
