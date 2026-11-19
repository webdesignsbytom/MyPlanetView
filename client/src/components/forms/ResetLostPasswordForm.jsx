import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
// Constants
import { LOGIN_PAGE_URL, HOME_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useNavigateToPage from '@/hooks/useNavigateToPage';
// Context
import { useAuth } from '@/auth/AuthContext';
// Components
import AppLink from '@/components/common/AppLink';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import FormField from '@/components/ui/FormField';
import PasswordInput from '@/components/ui/PasswordInput';
import FormAlert from '@/components/forms/FormAlert';
// Regex
import { PASSWORD_REGEX, PASSWORD_RULE } from '@/utils/regex/regex';

function ResetLostPasswordForm() {
  const { resetPassword } = useAuth();
  const { userId, token } = useParams();
  const navigateToPage = useNavigateToPage();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    userId: userId,
    token: token,
  });
  const [inProgress, setInProgress] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [redirectIn, setRedirectIn] = useState(5);
  const timerRef = useRef(null);

  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    if (errorMsg) {
      const msg = String(errorMsg).toLowerCase();

      if (
        (msg.includes('match') || msg.includes('confirm')) &&
        confirmRef.current
      ) {
        confirmRef.current.focus();
      } else if (passwordRef.current) {
        passwordRef.current.focus();
      } else if (alertRef.current) {
        alertRef.current.focus();
      }
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      timerRef.current = setInterval(() => {
        setRedirectIn((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            navigateToPage(LOGIN_PAGE_URL);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }

    return () => timerRef.current && clearInterval(timerRef.current);
  }, [successMsg, navigateToPage]);

  const onChange = (e) => {
    setErrorMsg(null);

    const { name, value } = e.target;

    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const { password, confirmPassword } = formData;

    if (!PASSWORD_REGEX.test(password)) {
      return PASSWORD_RULE;
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match. Please re-enter them.';
    }

    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fieldError = validate();

    if (fieldError) {
      setErrorMsg(fieldError);
      return;
    }

    if (!token) {
      setErrorMsg('Invalid or missing reset link parameters.');
      return;
    }

    setInProgress(true);

    const result = await resetPassword({
      token: token,
      password: formData.password,
    });

    if (result?.ok) {
      setInProgress(false);
      setSuccessMsg('Your password has been updated. Redirecting to login…');
      return;
    }

    setErrorMsg(result?.error || 'Unable to reset password.');
    setInProgress(false);
  };

  return (
    <form
      className='grid gap-y-4'
      onSubmit={onSubmit}
      aria-describedby='reset-help'
      aria-busy={inProgress ? 'true' : 'false'}
      noValidate
    >
      <p id='reset-help' className='sr-only'>
        Enter and confirm a new password. Password must be at least 8
        characters, include an uppercase letter, a number, and a special
        character, and must not contain slash, backslash, or quotes.
      </p>

      <FormField
        id='password'
        label='New password'
        hint={PASSWORD_RULE}
        error={errorMsg ? String(errorMsg) : ''}
      >
        <PasswordInput
          refProp={passwordRef}
          id='password'
          name='password'
          value={formData.password}
          onChange={onChange}
          required
          autoComplete='new-password'
          ariaInvalid={Boolean(errorMsg)}
          ariaDescribedBy={errorMsg ? 'password-error' : 'password-hint'}
        />
      </FormField>

      <FormField
        id='confirmPassword'
        label='Confirm new password'
        hint='Re-enter the same password.'
        error={errorMsg ? String(errorMsg) : ''}
      >
        <PasswordInput
          refProp={confirmRef}
          id='confirmPassword'
          name='confirmPassword'
          value={formData.confirmPassword}
          onChange={onChange}
          required
          autoComplete='new-password'
          ariaInvalid={Boolean(errorMsg)}
          ariaDescribedBy={
            errorMsg ? 'confirmPassword-error' : 'confirmPassword-hint'
          }
        />
      </FormField>

      <div className='grid h-fit w-full'>
        <button
          type='submit'
          className='btn-poster'
          disabled={inProgress}
          aria-label='Set new password'
        >
          {inProgress ? (
            <div
              className='flex justify-center items-center gap-2'
              aria-live='polite'
            >
              <LoadingSpinner xs />
              <span className='sr-only'>Updating password…</span>
            </div>
          ) : (
            <span>Update password</span>
          )}
        </button>
      </div>

      <FormAlert
        innerRef={alertRef}
        message={
          successMsg
            ? `${String(successMsg)}${
                redirectIn > 0 ? ` Redirecting in ${redirectIn}s…` : ''
              }`
            : errorMsg
        }
        variant={successMsg ? 'success' : 'error'}
      />

      <div className='grid gap-1 justify-center text-center'>
        <p className='text-sm'>
          Back to{' '}
          <AppLink
            to={LOGIN_PAGE_URL}
            label='login'
            description='login page'
            ariaLabel='login page'
            className='font-medium text-colour6 hover:underline'
          />
        </p>
        <p className='text-sm'>
          Or go{' '}
          <AppLink
            to={HOME_PAGE_URL}
            label='home'
            description='homepage'
            ariaLabel='homepage'
            className='font-medium text-colour6 hover:underline'
          />
        </p>
      </div>
    </form>
  );
}

export default ResetLostPasswordForm;
