import React, { useEffect, useRef, useState } from 'react';
// Api
import client from '@/api/client';
// Constants
import { LOGIN_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { RESET_PASSWORD_REQUEST_API } from '@/utils/constants/apiRoutes';
// Components
import AppLink from '@/components/common/AppLink';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import FormAlert from '@/components/forms/FormAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

function ForgotPasswordForm() {
  const [resetRequestInProgress, setResetRequestInProgress] = useState(false);
  const [resetRequestError, setResetRequestError] = useState(null);
  const [resetRequestSuccess, setResetRequestSuccess] = useState(null);
  const [resetFormData, setResetFormData] = useState({ email: '' });

  const emailRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    // Focus meaningful target on result
    if (resetRequestError && alertRef.current) {
      alertRef.current.focus();
    } else if (resetRequestSuccess && alertRef.current) {
      alertRef.current.focus();
    }
  }, [resetRequestError, resetRequestSuccess]);

  const handleResetRequest = (event) => {
    event.preventDefault();
    setResetRequestInProgress(true);
    setResetRequestError(null);
    setResetRequestSuccess(null);

    client
      .post(RESET_PASSWORD_REQUEST_API, resetFormData, false)
      .then(() => {
        setResetRequestInProgress(false);
        setResetRequestSuccess(
          'If an account exists for that email, a reset link has been sent.',
        );
      })
      .catch((err) => {
        setResetRequestError(
          err.friendlyMessage ||
            'Unable to request password reset. Please try again.',
        );
        setResetRequestInProgress(false);
      });
  };

  const handleChange = (event) => {
    setResetRequestError(null);
    setResetRequestSuccess(null);
    const { name, value } = event.target;
    setResetFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form
      className='grid gap-y-4'
      onSubmit={handleResetRequest}
      aria-describedby='forgot-help'
      aria-busy={resetRequestInProgress ? 'true' : 'false'}
      noValidate
    >
      <p id='forgot-help' className='sr-only'>
        Enter the email associated with your account to receive a reset link.
      </p>

      {/* Email */}
      <FormField
        id='email'
        label='Email'
        hint='Enter the email you used to sign up.'
        error={Boolean(resetRequestError)}
      >
        <TextInput
          refProp={emailRef}
          type='email'
          name='email'
          id='email'
          value={resetFormData.email}
          onChange={handleChange}
          placeholder='name@email.com'
          required
          inputMode='email'
          autoComplete='email'
          autoCapitalize='none'
          spellCheck='false'
        />
      </FormField>

      {/* Submit */}

      <div className='grid h-fit w-full'>
        <button
          type='submit'
          label='Send reset link'
          aria-label='Request a password reset link'
          className='btn-poster'
          disabled={resetRequestInProgress}
        >
          {resetRequestInProgress ? (
            <div
              className='flex justify-center items-center gap-2'
              aria-live='polite'
            >
              <LoadingSpinner xs={true} />
              <span className='sr-only'>Sending reset link…</span>
            </div>
          ) : (
            <span>Submit</span>
          )}
        </button>
      </div>

      {/* Result live region */}
      <FormAlert
        innerRef={alertRef}
        message={resetRequestError || resetRequestSuccess}
        variant={resetRequestError ? 'error' : 'success'}
      />

      {/* Secondary links (centered, AppLink) */}
      <div className='grid gap-1 justify-center text-center'>
        <p className='text-sm'>
          Remembered your password?{' '}
          <AppLink
            to={LOGIN_PAGE_URL}
            label='Back to login'
            description='login page'
          />
        </p>
        <p className='text-sm'>
          Don’t have an account yet?{' '}
          <AppLink
            to={SIGN_UP_PAGE_URL}
            label='Sign up now!'
            description='account registration page'
          />
        </p>
      </div>
    </form>
  );
}

export default ForgotPasswordForm;
