import React, { useState } from 'react';
// Api
import { deleteTheme } from '@/api/themesApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { monthLabel } from '@/utils/themes/themeWords';

// Deleting a theme no photo is entered in (one with photos is an album on people's maps,
// so it stays). `onDeleted(theme)` once it's gone.
function ThemeDeleteDialog({ theme, onDeleted, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteTheme(theme.id);
      onDeleted(theme);
    } catch (err) {
      setError(err.friendlyMessage || 'The theme couldn’t be deleted.');
      setBusy(false);
    }
  };

  return (
    <Modal title={`Delete “${theme.title}”?`} onClose={onClose}>
      <p className='text-sm'>{monthLabel(theme.month)} will have no theme until you write another.</p>
      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onClose}>
          Keep it
        </Button>
        <Button danger busy={busy} onClick={confirm}>
          Delete theme
        </Button>
      </div>
    </Modal>
  );
}

export default ThemeDeleteDialog;
