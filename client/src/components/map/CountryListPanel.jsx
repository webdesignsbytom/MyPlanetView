import React, { memo, useCallback, useMemo, useState } from 'react';
// Data
import { PLAIN_COUNTRIES, SPECIAL_PLACES } from '@/utils/map/countries';
// Components
import MapPanel from './MapPanel';
import CountryListItem from './CountryListItem';
import UnplacedPhotosButton from './UnplacedPhotosButton';
import VerifyFirstNote from './VerifyFirstNote';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

const FILTERS = [
  { value: 'ALL', label: 'All places' },
  { value: 'VISITED', label: 'Visited' },
  { value: 'LIVED', label: 'Lived there' },
  { value: 'WANT_TO_GO', label: 'Want to go' },
  { value: 'NONE', label: 'Not yet' },
];

const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Every country as a list: the keyboard path to the whole map, and the quickest way to
// tick off many countries (the old site's "countries visited" list), then the special
// places (Antarctica and the poles) under their own heading. Photos with no country have
// their own list, opened from the top. The rows are memoised and get only stable
// callbacks, so a status change re-renders one row, and the map moving none.
function CountryListPanel({
  visitsByCode,
  canEdit,
  locked = false,
  onChangeStatus,
  onShowCountry,
  unplacedCount = 0,
  unplacedMore = false,
  onShowUnplaced,
  onClose,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);

  const [shownCountries, shownSpecial] = useMemo(() => {
    const term = fold(search.trim());
    const matches = (place) => {
      const status = visitsByCode[place.code] || 'NONE';
      if (filter !== 'ALL' && status !== filter) return false;
      return !term || fold(place.name).includes(term);
    };
    return [PLAIN_COUNTRIES.filter(matches), SPECIAL_PLACES.filter(matches)];
  }, [search, filter, visitsByCode]);

  const changeStatus = useCallback(
    async (code, status) => {
      setError(null);
      try {
        await onChangeStatus(code, status);
      } catch (err) {
        setError(err.friendlyMessage || 'That change could not be saved.');
      }
    },
    [onChangeStatus],
  );

  const row = (place) => (
    <CountryListItem
      key={place.code}
      country={place}
      status={visitsByCode[place.code]}
      canEdit={canEdit}
      onChangeStatus={changeStatus}
      onShow={onShowCountry}
    />
  );

  return (
    <MapPanel title='Countries' onClose={onClose}>
      {onShowUnplaced ? <UnplacedPhotosButton count={unplacedCount} more={unplacedMore} onOpen={onShowUnplaced} /> : null}
      {locked ? <VerifyFirstNote action='tick off countries' /> : null}
      <div className='grid gap-2 sm:grid-cols-2'>
        {/* The placeholder isn't a name: it goes as soon as you type */}
        <label htmlFor='country-search' className='sr-only'>
          Search countries and special places
        </label>
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
        {shownCountries.length} of {PLAIN_COUNTRIES.length} countries, {shownSpecial.length} of {SPECIAL_PLACES.length} special
        places
      </p>
      <ul aria-label='Countries' className='grid divide-y divide-dashed divide-poster-brown/40'>
        {shownCountries.map(row)}
      </ul>
      {shownSpecial.length ? (
        <section className='grid gap-1' aria-labelledby='country-list-special'>
          <h3 id='country-list-special' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
            Special places
          </h3>
          <p className='text-xs opacity-80'>Not countries, so they have their own count.</p>
          <ul className='grid divide-y divide-dashed divide-poster-brown/40'>{shownSpecial.map(row)}</ul>
        </section>
      ) : null}
    </MapPanel>
  );
}

export default memo(CountryListPanel);
