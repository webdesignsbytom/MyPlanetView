import React, { useRef, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Utils
import { mediaUrlFrom } from '@/utils/media/mediaUrl';
import { MAX_IMAGE_SIZE_MB } from '@/utils/media/mediaConstants';
// Components
import AppImage from '@/components/common/AppImage';
import FormField from '@/components/ui/FormField';
import FormAlert from '@/components/forms/FormAlert';
import TextInput from '@/components/ui/TextInput';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// Raster images only (no SVG)
const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';


function AccountProfileSection() {
  const { user, updateName, updateAvatar, removeAvatar } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [busy, setBusy] = useState('');
  const [alert, setAlert] = useState({ message: '', variant: 'error' });

  const fileRef = useRef(null);
  const alertRef = useRef(null);

  const showResult = (result, successMessage) => {
    setAlert(
      result.ok
        ? { message: successMessage, variant: 'success' }
        : { message: result.error, variant: 'error' },
    );
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  const onSaveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Enter a display name.');
      return;
    }
    setBusy('name');
    showResult(await updateName(trimmed), 'Your name has been updated.');
    setBusy('');
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!AVATAR_ACCEPT.split(',').includes(file.type)) {
      showResult({ ok: false, error: 'Choose a PNG, JPEG, WebP or GIF image.' });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      showResult({ ok: false, error: `Images must be ${MAX_IMAGE_SIZE_MB} MB or smaller.` });
      return;
    }

    setBusy('avatar');
    showResult(await updateAvatar(file), 'Your avatar has been updated.');
    setBusy('');
  };

  const onRemoveAvatar = async () => {
    setBusy('avatar');
    showResult(await removeAvatar(), 'Your avatar has been removed.');
    setBusy('');
  };

  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();
  // The server refuses uploads until the address is verified (docs/API.md, Access); the
  // button stays focusable so the reason is read with it. Removing is still allowed.
  const uploadLocked = user?.emailVerified === false;

  return (
    <div className='grid gap-6'>
      {/* Avatar */}
      <div className='grid justify-items-center gap-3'>
        {/* A round stamp on the paper, like the nav's MENU stamp */}
        <div className='grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-double border-poster-brown bg-poster-paper text-poster-ink shadow-paper'>
          {user?.image ? (
            <AppImage
              src={mediaUrlFrom({ objectKey: user.image })}
              alt={`${user.name || 'Your'} avatar`}
              ratio='1/1'
              className='w-24 h-24'
              imgClassName='object-cover'
            />
          ) : (
            <span className='font-travel text-4xl' aria-hidden='true'>
              {initial}
            </span>
          )}
        </div>

        <div className='grid justify-center gap-3 sm:grid-flow-col sm:auto-cols-max'>
          <input
            ref={fileRef}
            type='file'
            accept={AVATAR_ACCEPT}
            className='sr-only'
            id='avatar-file'
            onChange={onPickFile}
            disabled={busy === 'avatar' || uploadLocked}
          />
          <button
            type='button'
            className='btn-poster aria-disabled:cursor-not-allowed aria-disabled:opacity-60'
            onClick={() => {
              if (!uploadLocked) fileRef.current?.click();
            }}
            disabled={busy === 'avatar'}
            aria-disabled={uploadLocked || undefined}
            aria-describedby={uploadLocked ? 'avatar-verify-note' : undefined}
          >
            {busy === 'avatar' ? <LoadingSpinner xs /> : user?.image ? 'Change avatar' : 'Upload avatar'}
          </button>
          {user?.image ? (
            <button
              type='button'
              className='btn-paper'
              onClick={onRemoveAvatar}
              disabled={busy === 'avatar'}
            >
              Remove
            </button>
          ) : null}
        </div>
        {uploadLocked ? (
          <p id='avatar-verify-note' className='text-sm font-semibold text-center'>
            Verify your email to add a photo.
          </p>
        ) : (
          <p className='text-xs opacity-70'>PNG, JPEG, WebP or GIF, up to {MAX_IMAGE_SIZE_MB} MB.</p>
        )}
      </div>

      {/* Display name */}
      <form className='grid gap-y-4' onSubmit={onSaveName} noValidate>
        <FormField id='displayName' label='Display name' error={nameError} required>
          <TextInput
            name='displayName'
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError('');
            }}
            autoComplete='name'
            maxLength={80}
            required
          />
        </FormField>
        <button type='submit' className='btn-poster' disabled={busy === 'name'}>
          {busy === 'name' ? <LoadingSpinner xs /> : 'Save name'}
        </button>
      </form>

      <FormAlert innerRef={alertRef} message={alert.message} variant={alert.variant} />
    </div>
  );
}

export default AccountProfileSection;
