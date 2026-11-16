import React, { useEffect, useRef, useState } from 'react';
// Components
import AppLink from '../common/AppLink';
import CountrySelect from '../utils/CountrySelect';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PasswordInput from '@/components/ui/PasswordInput';
import CheckboxInput from '@/components/ui/CheckboxInput';
import FormAlert from '@/components/forms/FormAlert';
import PromoCodeField from '@/components/forms/PromoCodeField';
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
import usePromoCodeCheck from '@/hooks/usePromoCodeCheck';
// Regex
import { PASSWORD_REGEX, PASSWORD_RULE } from '@/utils/regex/regex';
// Utils
import {
  PROMO_CODE_INVALID,
  forgetPromoCode,
  normalisePromoCode,
  promoCodeInSearch,
  rememberedPromoCode,
} from '@/utils/plans/promoCodes';
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
    // Unticked: it's the age confirmation as well as the terms (docs/FEATURE-PLAN.md,
    // "Children and editors"), so the person has to tick it themselves
    agreedToTerms: false,
    // Optional: a creator's code (docs/API.md, "Promo codes"), filled from ?code= below
    promoCode: '',
  });

  const [registerError, setRegisterError] = useState(null);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);
  // The server refused the code at sign-up (it was turned off or used up meanwhile)
  const [promoRefused, setPromoRefused] = useState(false);
  const { result: promoCheck, checkNow: checkPromoCodeNow } = usePromoCodeCheck(registerFormData.promoCode);

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const promoCodeRef = useRef(null);
  const alertRef = useRef(null);

  // A creator's link (/sign-up?code=SAMTRAVELS), or one that landed on another page this
  // visit (useRememberPromoCode). Read in an effect, as storage and the address must be.
  const { search } = location;
  useEffect(() => {
    const code = promoCodeInSearch(search) || rememberedPromoCode();
    if (code) setRegisterFormData((prev) => (prev.promoCode ? prev : { ...prev, promoCode: code }));
  }, [search]);

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
      } else if (registerError === PROMO_CODE_INVALID && promoCodeRef.current) {
        promoCodeRef.current.focus();
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
      setRegisterError(PASSWORD_RULE);
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
        'Please confirm you’re 13 or over and agree to the terms and conditions to continue.'
      );
      setRegistrationInProgress(false);
      return;
    }

    // A code already found unusable isn't sent; one not checked yet is left to the server
    const typedCode = registerFormData.promoCode.trim();
    if (typedCode && promoCheck.status === 'invalid') {
      setRegisterError(PROMO_CODE_INVALID);
      setRegistrationInProgress(false);
      return;
    }

    const result = await register({
      ...registerFormData,
      promoCode: typedCode ? normalisePromoCode(typedCode) || typedCode : '',
    });

    setRegistrationInProgress(false);

    if (!result.ok) {
      setPromoRefused(result.error === PROMO_CODE_INVALID);
      setRegisterError(result.error || 'Something went wrong.');
      return;
    }

    // Signed in: back to the invite that sent them here, else set up their map
    forgetPromoCode();
    navigateToPage(returnTo || WELCOME_PAGE_URL);
  };

  const handleChange = (event) => {
    setRegisterError(null);
    const { name, value } = event.target;
    if (name === 'promoCode') {
      setPromoRefused(false);
      // Cleared on purpose: not filled in again from this visit's link
      if (!value.trim()) forgetPromoCode();
    }
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
        All fields are required, apart from the promo code. Use a valid email and a strong password.
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
        hint={PASSWORD_RULE}
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

      <PromoCodeField
        refProp={promoCodeRef}
        value={registerFormData.promoCode}
        onChange={handleChange}
        onBlur={checkPromoCodeNow}
        result={promoCheck}
        invalid={promoRefused}
      />

      <CheckboxInput
        id='termsChecked'
        name='termsChecked'
        checked={registerFormData.agreedToTerms}
        onChange={handleCheckboxChange}
        required
        ariaLabel='I am 13 or over and agree to the terms and conditions'
        label={
          <>
            I’m 13 or over (with a parent’s or guardian’s permission if I’m under 18), and I agree to the{' '}
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