import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
// Utils
import { promoOfferText } from '@/utils/plans/promoCodes';

const STATUS_ID = 'promoCode-status';

// What the check found, and its tone
function statusOf(result) {
  switch (result.status) {
    case 'checking':
      return { text: 'Checking the code…', tone: 'opacity-70' };
    case 'valid':
      return { text: promoOfferText(result), tone: 'text-status-good' };
    case 'invalid':
      return { text: result.message, tone: 'text-status-critical' };
    case 'unknown':
      return { text: result.message, tone: 'text-status-warning' };
    default:
      return { text: '', tone: '' };
  }
}

// The sign-up form's optional promo code (docs/API.md, "Promo codes"), filled from a
// creator's `?code=` link. `result` is usePromoCodeCheck's: what the code gives, or why it
// can't be used, is said under the field as soon as it's known (a polite live region).
// `invalid` also marks it when the server refused it at sign-up.
function PromoCodeField({ value, onChange, onBlur, refProp, result, invalid = false }) {
  // Refused at sign-up (turned off or used up since it was checked): the form's own error
  // says so, so an earlier "valid" goes
  const status = statusOf(invalid && result.status === 'valid' ? { status: 'idle' } : result);

  return (
    <div className='grid gap-y-2'>
      <FormField
        id='promoCode'
        label='Promo code (optional)'
        hint='From a creator’s post or link. No code? Leave it empty.'
        error={invalid || result.status === 'invalid'}
      >
        <TextInput
          refProp={refProp}
          type='text'
          id='promoCode'
          name='promoCode'
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={64}
          autoComplete='off'
          autoCapitalize='characters'
          spellCheck='false'
        />
      </FormField>
      <p id={STATUS_ID} role='status' aria-live='polite' className={`text-sm text-center ${status.tone}`}>
        {status.text}
      </p>
    </div>
  );
}

export default PromoCodeField;
