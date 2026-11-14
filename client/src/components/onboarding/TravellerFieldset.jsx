import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { COUNTRY_OPTIONS } from '@/utils/map/countries';

const COUNTRY_CHOICES = [{ value: '', label: 'Not set' }, ...COUNTRY_OPTIONS];

// One traveller on a map: a name, and (as on the old set-up form) where they were born
// and their favourite country. No login needed: children can be travellers too.
function TravellerFieldset({ index, traveller, onChange, onRemove, canRemove }) {
  const prefix = `traveller-${index}`;
  const set = (key) => (e) => onChange({ ...traveller, [key]: e.target.value });

  return (
    <fieldset className='grid gap-3 border-2 border-dashed border-poster-brown/60 px-4 py-3'>
      <legend className='px-1 font-travel text-base uppercase tracking-wide text-colour9'>Traveller {index + 1}</legend>
      <FormField id={`${prefix}-name`} label='Name' required>
        <TextInput value={traveller.name} onChange={set('name')} maxLength={60} autoComplete='off' required />
      </FormField>
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${prefix}-birth`} label='Born in'>
          <PlainOptionSelect value={traveller.birthCountryCode || ''} onChange={set('birthCountryCode')} options={COUNTRY_CHOICES} />
        </FormField>
        <FormField id={`${prefix}-favourite`} label='Favourite country'>
          <PlainOptionSelect
            value={traveller.favouriteCountryCode || ''}
            onChange={set('favouriteCountryCode')}
            options={COUNTRY_CHOICES}
          />
        </FormField>
      </div>
      {canRemove ? (
        <button type='button' onClick={onRemove} className='justify-self-end text-sm text-status-critical underline underline-offset-2'>
          Remove {traveller.name || 'this traveller'}
        </button>
      ) : null}
    </fieldset>
  );
}

export default TravellerFieldset;
