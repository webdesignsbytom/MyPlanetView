import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
// Utils
import { PROMO_LABEL_MAX, PROMO_MAX_USES_MAX } from '@/utils/plans/promoCodes';

// A promo code's details, shared by the new-code card and the change dialog: its label and
// optional limits (the followers' offer is the same for every code).
// `form` holds the inputs' strings (utils/plans/promoCodeForm.js); `onChange(field, value)`.
function PromoCodeFields({ idPrefix, form, errors = {}, onChange }) {
  const set = (field) => (e) => onChange(field, e.target.value);

  return (
    <>
      <FormField
        id={`${idPrefix}-label`}
        label='Label (only admins see it)'
        hint='Who it’s for, and when: “Sam’s Travels on YouTube, spring 2027”.'
        error={errors.label}
        required
      >
        <TextInput value={form.label} maxLength={PROMO_LABEL_MAX} onChange={set('label')} autoComplete='off' />
      </FormField>

      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${idPrefix}-max-uses`} label='Most sign-ups (optional)' hint='Empty: no limit.' error={errors.maxUses}>
          <TextInput
            type='number'
            inputMode='numeric'
            min={1}
            max={PROMO_MAX_USES_MAX}
            step={1}
            value={form.maxUses}
            onChange={set('maxUses')}
          />
        </FormField>
        <FormField id={`${idPrefix}-last-day`} label='Last day it works (optional)' hint='Empty: no end date.' error={errors.lastDay}>
          <TextInput type='date' value={form.lastDay} onChange={set('lastDay')} />
        </FormField>
      </div>
    </>
  );
}

export default PromoCodeFields;
