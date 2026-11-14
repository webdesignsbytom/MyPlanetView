import React, { useEffect, useRef, useState } from 'react';
// Components
import AppLink from '../common/AppLink';
import CountrySelect from '../utils/CountrySelect';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PasswordInput from '@/components/ui/PasswordInput';
import CheckboxInput from '@/components/ui/CheckboxInput';
import FormAlert from '@/components/forms/FormAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Constants
import {
  WELCOME_PAGE_URL,
  LOGIN_PAGE_URL,
  LEGAL_AGREEMENTS_PAGE_URL,
} from '@/utils/constants/routes';
// Hooks
import { useLocation } from 'react-router-dom';
import useNavigateToPage from '@/hooks/useNavigateToPage';
// Regex
import { PASSWORD_REGEX } from '@/utils/regex/regex';
// Auth
import { useAuth } from '@/auth/AuthContext';

function RegisterForm() {
  const { register } = useAuth();
  const navigateToPage = useNavigateToPage();
  // An invite link sends people here with somewhere to come back to
  const location = useLocation();
  const returnTo = location.state?.from || null;

  const [registerFormData, setRegisterFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    country: 'United Kingdom',
    agreedToTerms: true,
  });

  const [registerError, setRegisterError] = useState(null);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const alertRef = useRef(null);

  const isPasswordValid = PASSWORD_REGEX.test(registerFormData.password);
  const isConfirmValid =
    registerFormData.confirmPassword.length > 0 &&
    registerFormData.confirmPassword === registerFormData.password &&
    PASSWORD_REGEX.test(registerFormData.confirmPassword);

  useEffect(() => {
    if (registerError) {
      if (!registerFormData.username && usernameRef.current) {
        usernameRef.current.focus();
      } else if (!registerFormData.email && emailRef.current) {
        emailRef.current.focus();
      } else if (!registerFormData.password && passwordRef.current) {
        passwordRef.current.focus();
      } else if (
        !registerFormData.confirmPassword &&
        confirmPasswordRef.current
      ) {
        confirmPasswordRef.current.focus();
      } else if (alertRef.current) {
        alertRef.current.focus();
      }
    }
  }, [
    registerError,
    registerFormData.username,
    registerFormData.email,
    registerFormData.password,
    registerFormData.confirmPassword,
  ]);

  const handleSubmitRegisterForm = async (event) => {
    event.preventDefault();
    setRegistrationInProgress(true);
    setRegisterError(null);

    if (!isPasswordValid) {
      setRegisterError(
        'Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character, and cannot contain / or \\.'
      );
      setRegistrationInProgress(false);
      return;
    }

    if (!isConfirmValid) {
      setRegisterError(
        'Passwords do not match or fail requirements. Please re-enter them.'
      );
      setRegistrationInProgress(false);
      return;
    }

    if (!registerFormData.agreedToTerms) {
      setRegisterError(
        'You must agree to the terms and conditions to continue.'
      );
      setRegistrationInProgress(false);
      return;
    }

    const result = await register(registerFormData);

    setRegistrationInProgress(false);

    if (!result.ok) {
      setRegisterError(result.error || 'Something went wrong.');
      return;
    }

    // Signed in: back to the invite that sent them here, else set up their map
    navigateToPage(returnTo || WELCOME_PAGE_URL);
  };

  const handleChange = (event) => {
    setRegisterError(null);
    const { name, value } = event.target;
    setRegisterFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = () => {
    setRegisterFormData((prev) => ({
      ...prev,
      agreedToTerms: !prev.agreedToTerms,
    }));
  };

  return (
    <form
      className='grid gap-y-4'
      onSubmit={handleSubmitRegisterForm}
      aria-busy={registrationInProgress ? 'true' : 'false'}
      aria-describedby='register-help'
      noValidate
    >
      <p id='register-help' className='text-xs text-center opacity-70'>
        All fields are required. Use a valid email and a strong password.
      </p>

      <FormField
        id='username'
        label='Username'
        hint='Choose a unique username.'
        error={Boolean(registerError)}
      >
        <TextInput
          refProp={usernameRef}
          type='text'
          id='username'
          name='username'
          value={registerFormData.username}
          onChange={handleChange}
          placeholder='Username'
          required
          autoComplete='username'
        />
      </FormField>

      <FormField
        id='email'
        label='Email'
        hint='Enter a valid email address.'
        error={Boolean(registerError)}
      >
        <TextInput
          refProp={emailRef}
          type='email'
          id='email'
          name='email'
          value={registerFormData.email}
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
        hint='Password must be at least 8 characters, include 1 uppercase letter, 1 number, 1 special character, and cannot contain / or \.'
        error={Boolean(registerError)}
      >
        <PasswordInput
          refProp={passwordRef}
          id='password'
          name='password'
          value={registerFormData.password}
          onChange={handleChange}
          required
          autoComplete='new-password'
          pattern='^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\\/]).{8,}$'
          title='Min 8 chars, 1 uppercase, 1 number, 1 special character, and no / or \.'
        />
      </FormField>

      <FormField
        id='confirmPassword'
        label='Confirm Password'
        hint='Re-enter your password. It must match and meet the same requirements.'
        error={Boolean(registerError)}
      >
        <PasswordInput
          refProp={confirmPasswordRef}
          id='confirmPassword'
          name='confirmPassword'
          value={registerFormData.confirmPassword}
          onChange={handleChange}
          required
          autoComplete='new-password'
          pattern='^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\\/]).{8,}$'
          title='Min 8 chars, 1 uppercase, 1 number, 1 special character, and no / or \.'
        />
      </FormField>

      <FormField id='country' label='Country'>
        <CountrySelect
          id='country'
          name='country'
          value={registerFormData.country}
          onChange={handleChange}
        />
      </FormField>

      <CheckboxInput
        id='termsChecked'
        name='termsChecked'
        checked={registerFormData.agreedToTerms}
        onChange={handleCheckboxChange}
        required
        ariaLabel='Agree to terms and conditions'
        label={
          <>
            I agree to all{' '}
            <AppLink
              to={LEGAL_AGREEMENTS_PAGE_URL}
              label='terms and conditions'
              description='terms and conditions'
            />
            .
          </>
        }
      />

      <div className='grid h-fit w-full'>
        <button
          type='submit'
          className='btn-poster'
          disabled={registrationInProgress}
          aria-label='Register your account'
        >
          {registrationInProgress ? (
            <div className='flex justify-center items-center gap-2' aria-live='polite'>
              <LoadingSpinner xs={true} />
              <span className='sr-only'>Registering…</span>
            </div>
          ) : (
            <span>Register Now</span>
          )}
        </button>
      </div>

      <FormAlert innerRef={alertRef} message={registerError} />

      <aside className='grid justify-center'>
        <p className='text-sm'>
          Already a member?{' '}
          <AppLink
            to={LOGIN_PAGE_URL}
            label='Login Now'
            description='login page'
            ariaLabel='login page'
          />
        </p>
      </aside>
    </form>
  );
}

export default RegisterForm;