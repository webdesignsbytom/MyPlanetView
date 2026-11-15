import React, { useRef, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Components
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/ui/FormField';
import PasswordInput from '@/components/ui/PasswordInput';
import CheckboxInput from '@/components/ui/CheckboxInput';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Regex
import { PASSWORD_REGEX, PASSWORD_RULE } from '@/utils/regex/regex';

const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

function ChangePasswordForm() {
  const { changePassword } = useAuth();

  const [formData, setFormData] = useState(emptyForm);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [inProgress, setInProgress] = useState(false);
  const [alert, setAlert] = useState({ message: '', variant: 'error' });

  const refs = {
    currentPassword: useRef(null),
    newPassword: useRef(null),
    confirmPassword: useRef(null),
  };
  const alertRef = useRef(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: '' }));
    setAlert({ message: '', variant: 'error' });
  };

  const validate = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Enter your current password.';
    if (!PASSWORD_REGEX.test(newPassword)) {
      errors.newPassword = PASSWORD_RULE;
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'Your new password must be different from your current one.';
    }
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setAlert({ message: '', variant: 'error' });

    const errors = validate();
    setFieldErrors(errors);
    const firstInvalid = Object.keys(refs).find((name) => errors[name]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    setInProgress(true);
    const result = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      revokeOtherSessions: signOutOthers,
    });
    setInProgress(false);

    if (result.ok) {
      setFormData(emptyForm);
      setAlert({ message: 'Your password has been updated.', variant: 'success' });
    } else {
      setAlert({ message: result.error, variant: 'error' });
    }
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  return (
    <form
      className='grid gap-y-4'
      onSubmit={onSubmit}
      aria-describedby='change-password-help'
      aria-busy={inProgress ? 'true' : 'false'}
      noValidate
    >
      <p id='change-password-help' className='sr-only'>
        Enter your current password, then enter and confirm a new password.
      </p>

      <FormField
        id='currentPassword'
        label='Current password'
        error={fieldErrors.currentPassword}
        required
      >
        <PasswordInput
          refProp={refs.currentPassword}
          name='currentPassword'
          value={formData.currentPassword}
          onChange={onChange}
          required
          autoComplete='current-password'
        />
      </FormField>

      <FormField
        id='newPassword'
        label='New password'
        hint={PASSWORD_RULE}
        error={fieldErrors.newPassword}
        required
      >
        <PasswordInput
          refProp={refs.newPassword}
          name='newPassword'
          value={formData.newPassword}
          onChange={onChange}
          required
          autoComplete='new-password'
        />
      </FormField>

      <FormField
        id='confirmPassword'
        label='Confirm new password'
        error={fieldErrors.confirmPassword}
        required
      >
        <PasswordInput
          refProp={refs.confirmPassword}
          name='confirmPassword'
          value={formData.confirmPassword}
          onChange={onChange}
          required
          autoComplete='new-password'
        />
      </FormField>

      <CheckboxInput
        id='revokeOtherSessions'
        name='revokeOtherSessions'
        checked={signOutOthers}
        onChange={(e) => setSignOutOthers(e.target.checked)}
        label='Sign out of my other devices'
      />

      <button
        type='submit'
        className='btn-poster'
        disabled={inProgress}
      >
        {inProgress ? (
          <span className='grid grid-row place-content-center items-center gap-2' aria-live='polite'>
            <LoadingSpinner xs />
            <span className='sr-only'>Updating password…</span>
          </span>
        ) : (
          'Change password'
        )}
      </button>

      <FormAlert innerRef={alertRef} message={alert.message} variant={alert.variant} />
    </form>
  );
}

export default ChangePasswordForm;
