import React, { memo, useCallback, useId, useMemo, useState } from 'react';
// Data
import { PLAIN_COUNTRIES, SPECIAL_PLACES } from '@/utils/map/countries';
// Components
import CountryTicket from './CountryTicket';
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

// The countries under their first letter, A to Z (accents folded: Côte d'Ivoire is a C)
function byLetter(places) {
  const groups = new Map();
  for (const place of places) {
    const letter = fold(place.name).charAt(0).toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(place);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([letter, list]) => ({ letter, places: list }));
}

// An index letter, or the special places' heading: it stays at the top of the list
// while its countries scroll under it
const INDEX_HEADING =
  'sticky -top-4 z-[1] grid grid-cols-reg items-center gap-3 bg-paper-cream py-1.5 font-travel uppercase leading-none tracking-wide text-colour6';

// Rows in one column, two from lg (the ticket is wide enough there)
const ROWS = 'grid lg:grid-cols-2 lg:gap-x-8';

// Every country as a list: the keyboard path to the whole map, and the quickest way to
// tick off many countries (the old site's "countries visited" list), as a ticket like a
// country's own (CountryTicket, with no stub) that the map page centres on wide screens.
// The countries come under A–Z index letters, each status a rubber stamp
// (CountryListItem), then the special places (Antarctica and the poles) under their own
// heading. Photos with no country have their own list, opened from the top. The rows are
// memoised and get only stable callbacks, so a status change re-renders one row, and the
// map moving none.
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
  const headingId = useId();

  const [shownCountries, shownSpecial] = useMemo(() => {
    const term = fold(search.trim());
    const matches = (place) => {
      const status = visitsByCode[place.code] || 'NONE';
      if (filter !== 'ALL' && status !== filter) return false;
      return !term || fold(place.name).includes(term);
    };
    return [PLAIN_COUNTRIES.filter(matches), SPECIAL_PLACES.filter(matches)];
  }, [search, filter, visitsByCode]);
  const letters = useMemo(() => byLetter(shownCountries), [shownCountries]);

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
    <CountryTicket title='Countries' kicker='Travel log, A to Z' onClose={onClose}>
      {onShowUnplaced ? <UnplacedPhotosButton count={unplacedCount} more={unplacedMore} onOpen={onShowUnplaced} /> : null}
      {locked ? <VerifyFirstNote action='tick off countries' /> : null}
      <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]'>
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
      {letters.length || shownSpecial.length ? null : <p className='text-sm'>Nowhere matches that. Try another spelling or show all places.</p>}
      {letters.map(({ letter, places }) => (
        <section key={letter} className='grid' aria-labelledby={`${headingId}-${letter}`}>
          <h3 id={`${headingId}-${letter}`} className={`${INDEX_HEADING} text-2xl`}>
            {letter}
            <span aria-hidden='true' className='border-t-2 border-dashed border-poster-brown/50' />
          </h3>
          <ul className={ROWS}>{places.map(row)}</ul>
        </section>
      ))}
      {shownSpecial.length ? (
        <section className='grid gap-1' aria-labelledby={`${headingId}-special`}>
          <h3 id={`${headingId}-special`} className={`${INDEX_HEADING} text-lg`}>
            Special places
            <span aria-hidden='true' className='border-t-2 border-dashed border-poster-brown/50' />
          </h3>
          <p className='text-xs opacity-80'>Not countries, so they have their own count.</p>
          <ul className={ROWS}>{shownSpecial.map(row)}</ul>
        </section>
      ) : null}
    </CountryTicket>
  );
}

export default memo(CountryListPanel);
