import React, { useState } from 'react';
// Api
import { createTheme, updateTheme } from '@/api/themesApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import ThemeFields from './ThemeFields';
// Utils
import { emptyThemeForm, monthOf, themeBodyFrom, themeFormFrom } from '@/utils/themes/themeForm';

// A new theme (`theme` null; `month` suggests one) or changes to one: its month (only while
// no photo is entered), title and blurb. `onSaved` gets the theme as the server answers it.
function ThemeEditDialog({ theme = null, month = '', onSaved, onClose }) {
  const [form, setForm] = useState(() => (theme ? themeFormFrom(theme) : emptyThemeForm(month)));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const monthLocked = Boolean(theme?.entryCount);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const parsed = themeBodyFrom(form, { existing: theme, thisMonth: monthOf(new Date()) });
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) return;
    setBusy(true);
    try {
      const saved = theme ? await updateTheme(theme.id, parsed.body) : await createTheme(parsed.body);
      onSaved(saved.theme);
    } catch (err) {
      setError(err.friendlyMessage || 'The theme couldn’t be saved.');
      setBusy(false);
    }
  };

  return (
    <Modal title={theme ? `Change “${theme.title}”` : 'New theme'} onClose={onClose}>
      <form className='grid gap-3' onSubmit={submit} noValidate>
        <ThemeFields idPrefix={theme ? 'edit-theme' : 'new-theme'} form={form} errors={errors} onChange={change} monthLocked={monthLocked} />
        <InlineAlert>{error}</InlineAlert>
        <div className='grid grid-row justify-end gap-2'>
          <Button quiet onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit' busy={busy}>
            {theme ? 'Save changes' : 'Make theme'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ThemeEditDialog;
