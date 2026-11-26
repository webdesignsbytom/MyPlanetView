import React, { memo, useCallback, useId, useMemo, useRef, useState } from 'react';
import { FaThumbtack } from 'react-icons/fa';
// Data
import { COUNTRY_BY_CODE, REGION_PLACES, SPECIAL_PLACES, countriesOnMap } from '@/utils/map/countries';
// Hooks
import useSplitUk from '@/hooks/useSplitUk';
// Components
import CountryTicket from './CountryTicket';
import CountryListItem from './CountryListItem';
import { ExpeditionStampIcon } from './StarBadge';
import UnplacedPhotosButton from './UnplacedPhotosButton';
import MapActionButton from './MapActionButton';
import PassportLink from './PassportLink';
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

// The list's own scroller (the ticket's body), so the jump moves nothing else on the page
function scrollerOf(element) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node;
  }
  return null;
}

// Every country as a list: the keyboard path to the whole map, and the quickest way to
// tick off many countries (the old site's "countries visited" list), as a ticket like a
// country's own (CountryTicket, with no stub) that the map page centres on wide screens.
// The countries come under A–Z index letters, each status a rubber stamp
// (CountryListItem), then the special places (Antarctica and the poles) under their own
// heading, which the stamp beside the counts jumps to, then the regions (Bali, Tasmania:
// regionPlaces.js) under theirs. Photos with no country have their
// own list, opened from the top. The rows are
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
  // "Where have you been?": tick several countries at once (QuickFillDialog; the owner and
  // co-owners; 22 Nov 2026)
  onQuickFill = null,
  // The map's passport ("Open passport"; 24 Nov 2026, the user's wish)
  passportHref = null,
  // The Strings panel (an editor's; docs/API.md "Strings"): its stamp on the toolbar until 24
  // Nov 2026, the user's wish: a shorter bar, the panel itself unchanged
  onOpenStrings = null,
  onClose,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const headingId = useId();
  const specialRef = useRef(null);
  const specialHeadingRef = useRef(null);

  // The map's countries: on a map that splits the UK, its nations, and the UK itself only
  // while it's marked from before the split (its nations not chosen yet: its ticket asks)
  const splitUk = useSplitUk();
  const countries = useMemo(() => countriesOnMap(splitUk), [splitUk]);
  const ukPending = splitUk && Boolean(visitsByCode.GB);
  const [shownCountries, shownSpecial, shownRegions] = useMemo(() => {
    const term = fold(search.trim());
    const matches = (place) => {
      const status = visitsByCode[place.code] || 'NONE';
      if (filter !== 'ALL' && status !== filter) return false;
      return !term || fold(place.name).includes(term);
    };
    const listed = ukPending ? [...countries, COUNTRY_BY_CODE.GB].sort((a, b) => a.name.localeCompare(b.name)) : countries;
    return [listed.filter(matches), SPECIAL_PLACES.filter(matches), REGION_PLACES.filter(matches)];
  }, [search, filter, visitsByCode, countries, ukPending]);
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

  // Scroll the list to the special places, and take focus there so Tab carries on from them
  const showSpecial = () => {
    const section = specialRef.current;
    const scroller = section && scrollerOf(section);
    if (!scroller) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      top: section.getBoundingClientRect().top - scroller.getBoundingClientRect().top,
      behavior: still ? 'auto' : 'smooth',
    });
    specialHeadingRef.current?.focus({ preventScroll: true });
  };

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
      {/* Side by side from sm, each as wide as the other; one alone takes the whole row */}
      {onQuickFill || onOpenStrings || passportHref ? (
        <div className='grid gap-2 sm:auto-cols-fr sm:grid-flow-col'>
          {onQuickFill ? (
            <MapActionButton quiet onClick={onQuickFill}>
              Tick several countries
            </MapActionButton>
          ) : null}
          {onOpenStrings ? (
            <MapActionButton quiet onClick={onOpenStrings}>
              <FaThumbtack aria-hidden='true' className='self-center' />
              <span>Strings</span>
            </MapActionButton>
          ) : null}
          {passportHref ? <PassportLink href={passportHref} /> : null}
        </div>
      ) : null}
      <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]'>
        {/* The placeholder isn't a name: it goes as soon as you type */}
        <label htmlFor='country-search' className='sr-only'>
          Search countries, special places and regions
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
      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3'>
        <p className='text-xs opacity-80' aria-live='polite'>
          {shownCountries.length} of {countries.length} countries, {shownSpecial.length} of {SPECIAL_PLACES.length} special places,{' '}
          {shownRegions.length} of {REGION_PLACES.length} regions
        </p>
        {shownSpecial.length ? (
          <button
            type='button'
            onClick={showSpecial}
            className='grid min-h-8 -rotate-2 grid-cols-reg items-center gap-1.5 border-2 border-double border-colour9 px-2 font-travel text-xs uppercase tracking-wide text-colour9 transition hover:rotate-0 hover:bg-colour9/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-colour6'
          >
            <ExpeditionStampIcon className='h-4 w-4' />
            Special places
          </button>
        ) : null}
      </div>
      {letters.length || shownSpecial.length || shownRegions.length ? null : <p className='text-sm'>Nowhere matches that. Try another spelling or show all places.</p>}
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
        <section ref={specialRef} className='grid gap-1' aria-labelledby={`${headingId}-special`}>
          <h3 ref={specialHeadingRef} id={`${headingId}-special`} tabIndex={-1} className={`${INDEX_HEADING} text-lg outline-none`}>
            Special places
            <span aria-hidden='true' className='border-t-2 border-dashed border-poster-brown/50' />
          </h3>
          <p className='text-xs opacity-80'>Not countries, so they have their own count.</p>
          <ul className={ROWS}>{shownSpecial.map(row)}</ul>
        </section>
      ) : null}
      {shownRegions.length ? (
        <section className='grid gap-1' aria-labelledby={`${headingId}-regions`}>
          <h3 id={`${headingId}-regions`} className={`${INDEX_HEADING} text-lg`}>
            Regions
            <span aria-hidden='true' className='border-t-2 border-dashed border-poster-brown/50' />
          </h3>
          <p className='text-xs opacity-80'>Part of a country, so never counted as one: marking one visited marks its country too.</p>
          <ul className={ROWS}>{shownRegions.map(row)}</ul>
        </section>
      ) : null}
    </CountryTicket>
  );
}

export default memo(CountryListPanel);
