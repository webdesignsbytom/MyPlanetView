import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// Constants
import {
  MAP_PAGE_URL,
  FORGOT_PASS_PAGE_URL,
  SIGN_UP_PAGE_URL,
} from '@/utils/constants/routes';
// Utls
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import { isValidEmail } from '@/utils/regex/regex';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import AppLink from '@/components/common/AppLink';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PasswordInput from '@/components/ui/PasswordInput';
import CheckboxInput from '@/components/ui/CheckboxInput';
import FormAlert from '@/components/forms/FormAlert';

function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Back to the guarded page that sent us here, else your map
  const redirectTo = location.state?.from || MAP_PAGE_URL;

  const [loginInProgress, setLoginInProgress] = useState(false);
  const [loginError, setLoginError] = useState(null);
  // What a field still needs (checked before sending): { email?, password? }
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: '',
    keepMeLoggedIn: false,
  });

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    if (loginError) {
      const msg = String(loginError).toLowerCase();

      if (msg.includes('email') && emailRef.current) {
        emailRef.current.focus();
      } else if (msg.includes('password') && passwordRef.current) {
        passwordRef.current.focus();
      } else if (alertRef.current) {
        alertRef.current.focus();
      }
    }
  }, [loginError]);

  const handleLogin = async (e) => {
    e.preventDefault();
    // Each field says what it needs before anything is sent: both empty used to go to the
    // server, which only answered "Invalid email" (19 Nov 2026, the audit)
    const problems = {};
    if (!isValidEmail(loginFormData.email.trim())) problems.email = 'Enter the email address you signed up with.';
    if (!loginFormData.password) problems.password = 'Enter your password.';
    setFieldErrors(problems);
    if (problems.email || problems.password) {
      (problems.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setLoginInProgress(true);
    setLoginError(null);

    const result = await login(
      loginFormData.email,
      loginFormData.password,
      loginFormData.keepMeLoggedIn,
    );

    setLoginInProgress(false);

    if (!result.ok) {
      setLoginError(result.error || 'Unable to sign in with those details. Please try again.');
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  const handleChange = (event) => {
    setLoginError(null);
    const { name, value } = event.target;
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    setLoginFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckedKeepMeLoggedIn = () => {
    setLoginFormData((prev) => ({
      ...prev,
      keepMeLoggedIn: !prev.keepMeLoggedIn,
    }));
  };

  return (
    <form
      className='grid gap-y-4'
      onSubmit={handleLogin}
      aria-describedby='login-help'
      aria-busy={loginInProgress ? 'true' : 'false'}
      noValidate
    >
      <p id='login-help' className='sr-only'>
        All fields are required. Use your account email and password.
      </p>

      <FormField
        id='email'
        label='Email'
        hint='Enter the email you used to sign up.'
        error={fieldErrors.email || Boolean(loginError)}
      >
        <TextInput
          refProp={emailRef}
          type='email'
          id='email'
          name='email'
          value={loginFormData.email}
          onChange={handleChange}
          placeholder='name@email.com'
          required
          inputMode='email'
          autoComplete='email'
          autoCapitalize='none'
          spellCheck='false'
        />
      </FormField>

      <FormField
        id='password'
        label='Password'
        hint='The password you chose for your account.'
        error={fieldErrors.password || Boolean(loginError)}
      >
        <PasswordInput
          refProp={passwordRef}
          id='password'
          name='password'
          value={loginFormData.password}
          onChange={handleChange}
          required
          autoComplete='current-password'
        />
      </FormField>

      <div className='grid gap-2 items-center justify-center'>
        <CheckboxInput
          id='keepMeLoggedIn'
          name='keepMeLoggedIn'
          checked={loginFormData.keepMeLoggedIn}
          onChange={handleCheckedKeepMeLoggedIn}
          label='Keep me logged in'
        />
      </div>

      <div className='grid justify-center'>
        <AppLink
          to={FORGOT_PASS_PAGE_URL}
          label='Forgot password?'
          description='password reset page'
          className='text-sm font-medium text-colour6 hover:underline'
        />
      </div>

      <div className='grid h-fit w-full'>
        <button
          type='submit'
          className='btn-poster'
          disabled={loginInProgress}
        >
          {loginInProgress ? (
            <div className='flex justify-center items-center gap-2' aria-live='polite'>
              <LoadingSpinner xs={true} />
              <span className='sr-only'>Signing in…</span>
            </div>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </div>

      <FormAlert innerRef={alertRef} message={loginError} />

      <div className='text-center'>
        <p className='text-sm'>
          Don’t have an account yet?{' '}
          <AppLink
            to={SIGN_UP_PAGE_URL}
            state={location.state?.from ? { from: location.state.from } : undefined}
            label='Sign up now!'
            description='account registration page'
            className='font-medium text-colour6 hover:underline'
          />
        </p>
      </div>
    </form>
  );
}

export default LoginForm;