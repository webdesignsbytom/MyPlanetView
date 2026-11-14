import React, { useMemo, useState } from 'react';
// Data
import { COUNTRIES } from '@/utils/map/countries';
// Components
import MapPanel from './MapPanel';
import CountryListItem from './CountryListItem';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

const FILTERS = [
  { value: 'ALL', label: 'All countries' },
  { value: 'VISITED', label: 'Visited' },
  { value: 'LIVED', label: 'Lived there' },
  { value: 'WANT_TO_GO', label: 'Want to go' },
  { value: 'NONE', label: 'Not yet' },
];

const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Every country as a list: the keyboard path to the whole map, and the quickest way to
// tick off many countries (the old site's "countries visited" list).
function CountryListPanel({ visitsByCode, canEdit, onChangeStatus, onShowCountry, onClose }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);

  const shown = useMemo(() => {
    const term = fold(search.trim());
    return COUNTRIES.filter((country) => {
      const status = visitsByCode[country.code] || 'NONE';
      if (filter !== 'ALL' && status !== filter) return false;
      return !term || fold(country.name).includes(term);
    });
  }, [search, filter, visitsByCode]);

  const changeStatus = async (code, status) => {
    setError(null);
    try {
      await onChangeStatus(code, status);
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
    }
  };

  return (
    <MapPanel title='Countries' onClose={onClose}>
      <div className='grid gap-2 sm:grid-cols-2'>
        <TextInput
          id='country-search'
          type='search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search countries'
          autoComplete='off'
        />
        <PlainOptionSelect
          id='country-filter'
          value={filter}
          options={FILTERS}
          ariaLabel='Show'
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {error ? (
        <p role='alert' className='rounded-lg border px-3 py-2 text-sm tone-danger'>
          {error}
        </p>
      ) : null}
      <p className='text-xs opacity-80' aria-live='polite'>
        {shown.length} of {COUNTRIES.length}
      </p>
      <ul className='grid divide-y divide-dashed divide-poster-brown/40'>
        {shown.map((country) => (
          <CountryListItem
            key={country.code}
            country={country}
            status={visitsByCode[country.code]}
            canEdit={canEdit}
            onChangeStatus={changeStatus}
            onShow={onShowCountry}
          />
        ))}
      </ul>
    </MapPanel>
  );
}

export default CountryListPanel;
