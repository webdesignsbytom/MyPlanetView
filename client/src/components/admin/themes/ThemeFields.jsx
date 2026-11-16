import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
// Utils
import { THEME_BLURB_MAX, THEME_TITLE_MAX } from '@/utils/themes/themeForm';

// A theme's fields, shared by the new-theme card and the change dialog: its month (locked
// once photos are entered: `monthLocked`), title and blurb.
// `form` holds the inputs' strings (utils/themes/themeForm.js); `onChange(field, value)`.
function ThemeFields({ idPrefix, form, errors = {}, onChange, monthLocked = false }) {
  const set = (field) => (e) => onChange(field, e.target.value);

  return (
    <>
      <FormField
        id={`${idPrefix}-month`}
        label='Month'
        hint={monthLocked ? 'Photos are entered in it, so its month stays.' : 'It runs for the whole calendar month.'}
        error={errors.month}
        required
      >
        <TextInput type='month' value={form.month} onChange={set('month')} placeholder='2027-01' disabled={monthLocked} />
      </FormField>
      <FormField id={`${idPrefix}-title`} label='Title' hint='Short and open: “Doors”, “Worst weather”.' error={errors.title} required>
        <TextInput value={form.title} maxLength={THEME_TITLE_MAX} onChange={set('title')} autoComplete='off' />
      </FormField>
      <FormField id={`${idPrefix}-blurb`} label='A line about it (optional)' hint={`Up to ${THEME_BLURB_MAX} characters.`} error={errors.blurb}>
        <TextAreaInput value={form.blurb} maxLength={THEME_BLURB_MAX} onChange={set('blurb')} rows={3} />
      </FormField>
    </>
  );
}

export default ThemeFields;
