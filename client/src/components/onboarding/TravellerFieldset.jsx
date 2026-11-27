import React, { useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { HOME_COUNTRY_OPTIONS, NATIONALITY_OPTIONS } from '@/utils/map/countries';
import { BIRTH_DATE_MIN, todayInput } from '@/utils/map/birthDates';

// The countries and Antarctica: nobody is born at a pole (the server refuses one here)
const COUNTRY_CHOICES = [{ value: '', label: 'Not set' }, ...HOME_COUNTRY_OPTIONS];
// A nationality is a country, never Antarctica
const NATIONALITY_CHOICES = [{ value: '', label: 'Not set' }, ...NATIONALITY_OPTIONS];

// One traveller on a map: a first name and an optional last name (27 Nov 2026, the user's wish:
// the passport's surname), and (as on the old set-up form) where they were born and their
// favourite country. No login needed: children can be travellers too.
// `askBirthDate` (23 Nov 2026, the user's wish: asked when people are added to a map, never at
// sign-up, so not on /welcome): an optional date of birth, for the share of their life spent
// travelling; only the map's editors see it. With it, their nationality (27 Nov 2026, the user's
// wish: "Passport also needs nationality"), for the passport.
// `legend`: the fieldset's title ("Traveller 2" when none: the passport's details card gives the
// person's name, 27 Nov 2026).
function TravellerFieldset({ index, traveller, onChange, onRemove, canRemove, askBirthDate = false, legend = null }) {
  const prefix = `traveller-${index}`;
  const set = (key) => (e) => onChange({ ...traveller, [key]: e.target.value });
  // Read once: the form is only ever drawn in the browser (Settings, never pre-rendered)
  const [today] = useState(todayInput);

  return (
    <fieldset className='grid gap-3 border-2 border-dashed border-poster-brown/60 px-4 py-3'>
      <legend className='px-1 font-travel text-base uppercase tracking-wide text-colour9'>{legend || `Traveller ${index + 1}`}</legend>
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${prefix}-name`} label='First name' required>
          <TextInput value={traveller.name} onChange={set('name')} maxLength={60} autoComplete='off' required />
        </FormField>
        <FormField id={`${prefix}-lastname`} label='Last name (optional)'>
          <TextInput value={traveller.lastName || ''} onChange={set('lastName')} maxLength={60} autoComplete='off' />
        </FormField>
      </div>
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
      {askBirthDate ? (
        <FormField id={`${prefix}-nationality`} label='Nationality (optional)' hint='For their passport page.'>
          <PlainOptionSelect value={traveller.nationalityCode || ''} onChange={set('nationalityCode')} options={NATIONALITY_CHOICES} />
        </FormField>
      ) : null}
      {askBirthDate ? (
        <FormField
          id={`${prefix}-born-on`}
          label='Date of birth (optional)'
          hint='Only the map’s editors see it. The statistics use it for how much of their life they’ve spent travelling.'
        >
          <TextInput type='date' value={traveller.birthDate || ''} onChange={set('birthDate')} min={BIRTH_DATE_MIN} max={today} autoComplete='off' />
        </FormField>
      ) : null}
      {canRemove ? (
        <button type='button' onClick={onRemove} className='justify-self-end text-sm text-status-critical underline underline-offset-2'>
          Remove {traveller.name || 'this traveller'}
        </button>
      ) : null}
    </fieldset>
  );
}

export default TravellerFieldset;
