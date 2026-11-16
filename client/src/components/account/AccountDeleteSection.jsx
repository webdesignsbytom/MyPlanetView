import React, { useEffect, useRef, useState } from 'react';
// Api
import { getLeavingOptions, putLeavingPlan } from '@/api/plansApi';
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
import LeavingChoices from './LeavingChoices';
// Utils
import { DELETE_MAP, defaultChoiceFor, leavingPlanFrom } from '@/utils/plans/leaving';

const quoted = (names) => names.map((name) => `“${name}”`).join(', ');

// Deleting the account: first what happens to each map it owns and to the photos it added
// to other people's maps (LeavingChoices), saved as the leaving plan (PUT
// /users/leaving-plan), then better-auth's delete with the password, which uses that plan.
function AccountDeleteSection() {
  const { deleteAccount } = useAuth();
  const { confirmAction, modalOpen, modalContent, handleModalConfirm, setModalOpen } =
    useConfirmAction();

  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState('');
  const [choices, setChoices] = useState({});
  const [leavePhotos, setLeavePhotos] = useState(true);
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const passwordRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getLeavingOptions()
      .then((loaded) => {
        if (cancelled) return;
        setOptions(loaded);
        setChoices(Object.fromEntries(loaded.maps.map((map) => [map.id, defaultChoiceFor(map)])));
      })
      .catch((err) => {
        if (!cancelled) setOptionsError(err.friendlyMessage || 'Your maps could not be loaded. Reload the page to try again.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fail = (message) => {
    setBusy(false);
    setErrorMsg(message);
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  const runDelete = async () => {
    setBusy(true);
    try {
      await putLeavingPlan(leavingPlanFrom(options.maps, choices, leavePhotos));
    } catch (err) {
      fail(err.friendlyMessage || 'Your choices could not be saved, so nothing was deleted.');
      return;
    }
    const result = await deleteAccount(password);
    if (!result.ok) fail(result.error);
  };

  // What the confirmation says will happen
  const summary = () => {
    const nameOf = (map, userId) => map.members.find((m) => m.userId === userId)?.name || 'someone on it';
    const given = options.maps.filter((m) => m.members.length && choices[m.id] && choices[m.id] !== DELETE_MAP);
    const deleted = options.maps.filter((m) => !given.includes(m));
    return [
      'This permanently deletes your account.',
      given.length ? `${given.map((m) => `“${m.name}” goes to ${nameOf(m, choices[m.id])}`).join('; ')}.` : '',
      deleted.length ? `${quoted(deleted.map((m) => m.name))} ${deleted.length === 1 ? 'is' : 'are'} deleted, with every trip and photo on ${deleted.length === 1 ? 'it' : 'them'}.` : '',
      leavePhotos ? 'Your photos on other people’s maps stay there.' : 'Your photos on other people’s maps are deleted.',
      'It cannot be undone.',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!options) return;
    if (!password) {
      setFieldError('Enter your password to confirm.');
      passwordRef.current?.focus();
      return;
    }
    confirmAction({ action: runDelete, header: 'Delete your account?', message: summary() });
  };

  return (
    <form className='grid gap-y-4' onSubmit={onSubmit} noValidate>
      <p className='text-sm text-center'>
        Permanently delete your account, profile and avatar. First choose what happens to each map you own: give it to
        someone on it, or delete it with its trips and photos. If you pay for a plan, it’s cancelled straight away and
        nothing more is charged. This cannot be undone.
      </p>

      {options ? (
        <LeavingChoices
          options={options}
          choices={choices}
          onChoose={(mapId, value) => setChoices((prev) => ({ ...prev, [mapId]: value }))}
          leavePhotos={leavePhotos}
          onLeavePhotosChange={setLeavePhotos}
          disabled={busy}
        />
      ) : optionsError ? (
        <p role='alert' className='text-sm text-center text-status-critical'>
          {optionsError}
        </p>
      ) : (
        <div className='grid place-items-center' role='status'>
          <LoadingSpinner />
          <span className='sr-only'>Loading your maps…</span>
        </div>
      )}

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
        // The danger button (components/common/Button's `danger`): parchment, deep-red ink
        className='btn-paper [--btn-ink:var(--poster-red-deep)]'
        disabled={busy || !options}
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
