import React, { useRef, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import FormField from '@/components/ui/FormField';
import FormAlert from '@/components/forms/FormAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import TextInput from '@/components/ui/TextInput';

function ChangeEmailForm() {
  const { user, changeEmail } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [alert, setAlert] = useState({ message: '', variant: 'error' });

  const emailRef = useRef(null);
  const alertRef = useRef(null);

  const validate = (email) => {
    if (!email) return 'Enter your new email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
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
      setAlert({
        message: `We've sent a confirmation link to ${email}. Your email changes once you click it.`,
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
        hint="We'll send a link to the new address to confirm it."
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
          autoComplete='email'
          inputMode='email'
          autoCapitalize='none'
          spellCheck={false}
        />
      </FormField>

      <button
        type='submit'
        className='py-2 bg-colour6 cursor-pointer text-colour1 shadow-lift-sm rounded-md hover:brightness-110 active:scale-95 active:brightness-90 disabled:opacity-60'
        disabled={inProgress}
      >
        {inProgress ? (
          <span className='flex justify-center items-center gap-2' aria-live='polite'>
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
