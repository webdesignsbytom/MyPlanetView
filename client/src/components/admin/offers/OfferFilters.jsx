import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { NO_COUNTRY, OFFER_KIND_OPTIONS, OFFER_STATES } from '@/utils/offers/offerAdmin';

const KIND_OPTIONS = [{ value: '', label: 'Every kind' }, ...OFFER_KIND_OPTIONS];
const STATE_OPTIONS = [{ value: '', label: 'Any' }, ...Object.entries(OFFER_STATES).map(([value, label]) => ({ value, label }))];

// The offers list's filters: words in the title, partner, key or blurb, the kind, the
// country (or the general offers, for anywhere) and where it stands. `countryOptions` are
// the countries the offers are for; `onChange(field, value)`.
function OfferFilters({ filters, countryOptions, onChange }) {
  const countries = [{ value: '', label: 'Every country' }, { value: NO_COUNTRY, label: 'Anywhere (general offers)' }, ...countryOptions];

  return (
    <form
      role='search'
      aria-label='Filter offers'
      className='grid gap-4 border-2 border-dashed border-poster-brown/60 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4'
      onSubmit={(e) => e.preventDefault()}
    >
      <FormField id='offer-search' label='Search offers'>
        <TextInput
          type='search'
          name='search'
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          autoComplete='off'
          maxLength={100}
        />
      </FormField>
      <FormField id='offer-kind-filter' label='Kind'>
        <PlainOptionSelect name='kind' value={filters.kind} onChange={(e) => onChange('kind', e.target.value)} options={KIND_OPTIONS} />
      </FormField>
      <FormField id='offer-country-filter' label='Country'>
        <PlainOptionSelect name='country' value={filters.country} onChange={(e) => onChange('country', e.target.value)} options={countries} />
      </FormField>
      <FormField id='offer-state-filter' label='State'>
        <PlainOptionSelect name='state' value={filters.state} onChange={(e) => onChange('state', e.target.value)} options={STATE_OPTIONS} />
      </FormField>
    </form>
  );
}

export default OfferFilters;
