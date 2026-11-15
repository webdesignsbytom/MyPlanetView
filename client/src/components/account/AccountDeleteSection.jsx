import React, { useRef, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Hooks
import useConfirmAction from '@/hooks/useConfirmAction';
// Components
import ConfirmModal from '@/components/modals/ConfirmModal';
import FormField from '@/components/ui/FormField';
import FormAlert from '@/components/forms/FormAlert';
import PasswordInput from '@/components/ui/PasswordInput';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

function AccountDeleteSection() {
  const { deleteAccount } = useAuth();
  const { confirmAction, modalOpen, modalContent, handleModalConfirm, setModalOpen } =
    useConfirmAction();

  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const passwordRef = useRef(null);
  const alertRef = useRef(null);

  const runDelete = async () => {
    setBusy(true);
    const result = await deleteAccount(password);
    if (!result.ok) {
      setBusy(false);
      setErrorMsg(result.error);
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!password) {
      setFieldError('Enter your password to confirm.');
      passwordRef.current?.focus();
      return;
    }
    confirmAction({
      action: runDelete,
      header: 'Delete your account?',
      message:
        'This permanently deletes your account, your photos, and your maps and trips. A map with an editor passes to that editor instead. It cannot be undone.',
    });
  };

  return (
    <form className='grid gap-y-4' onSubmit={onSubmit} noValidate>
      <p className='text-sm text-center'>
        Permanently delete your account, profile and avatar, every photo you uploaded (on any
        map), and your maps with their trips. A map of yours that has an editor isn’t
        deleted: it passes to the editor who has had access longest, with its trips but without
        your photos. This cannot be undone.
      </p>

      <FormField id='deletePassword' label='Your password' error={fieldError} required>
        <PasswordInput
          refProp={passwordRef}
          name='deletePassword'
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldError('');
            setErrorMsg('');
          }}
          autoComplete='current-password'
          required
        />
      </FormField>

      <button
        type='submit'
        className='py-2 solid-danger cursor-pointer shadow-lift-sm rounded-md hover:brightness-110 active:scale-95 disabled:opacity-60'
        disabled={busy}
      >
        {busy ? <LoadingSpinner xs /> : 'Delete my account'}
      </button>

      <FormAlert innerRef={alertRef} message={errorMsg} />

      {modalOpen ? (
        <ConfirmModal
          header={modalContent.header}
          message={modalContent.message}
          onConfirm={handleModalConfirm}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </form>
  );
}

export default AccountDeleteSection;
