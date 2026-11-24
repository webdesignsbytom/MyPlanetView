import React from 'react';
// Components
import PassportLeaf from './PassportLeaf';
// Utils
import { countryName } from '@/utils/map/countries';

const initials = (name) =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

// The machine-readable line at the foot of a real photo page, made from the travellers'
// names (decoration only)
const machineLine = (travellers) =>
  `P<MPV<<${travellers.map((t) => t.name.toUpperCase().replace(/[^A-Z]+/g, '<')).join('<<')}`.padEnd(44, '<').slice(0, 44);

/**
 * The passport's photo page: each traveller on the map laid out as a passport's holder,
 * with a photo box (their initials), their name, where they were born and their favourite
 * country.
 */
function PassportPhotoPage({ travellers, pageNumber, headingId }) {
  return (
    <PassportLeaf pageNumber={pageNumber} labelledBy={headingId}>
      {/* Wide screens: the travellers two by two, a page each, clear of the fold; the
          machine-readable line on the left-hand page */}
      <div className='grid content-start gap-5'>
        <h2 id={headingId} className='font-travel text-3xl uppercase leading-tight text-colour6'>
          Travellers
        </h2>
        {travellers.length ? (
          <ul className='grid gap-4 md:grid-cols-2 md:gap-x-16'>
            {travellers.map((traveller) => (
              // The photo box as tall as the details beside it, to their last line (24 Nov 2026, the
              // user's wish: a 3:4 box stopped a line short), and never shorter than 3:4
              <li key={traveller.id} className='grid grid-cols-[5rem_minmax(0,1fr)] gap-4 border-2 border-colour9/50 p-3'>
                <span
                  aria-hidden='true'
                  data-passport-photo=''
                  className='grid min-h-[6.75rem] place-items-center border-2 border-colour9 bg-colour8/40 font-travel text-3xl text-colour9'
                >
                  {initials(traveller.name)}
                </span>
                <dl className='grid min-w-0 content-start gap-1 text-sm'>
                  <dt className='font-travel text-xs uppercase tracking-wide text-colour9'>Name</dt>
                  <dd className='break-words font-semibold'>{traveller.name}</dd>
                  <dt className='font-travel text-xs uppercase tracking-wide text-colour9'>Born in</dt>
                  <dd>{traveller.birthCountryCode ? countryName(traveller.birthCountryCode) : 'Not given'}</dd>
                  <dt className='font-travel text-xs uppercase tracking-wide text-colour9'>Favourite country</dt>
                  <dd>{traveller.favouriteCountryCode ? countryName(traveller.favouriteCountryCode) : 'Not given'}</dd>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm'>No travellers on this map yet.</p>
        )}
        {travellers.length ? (
          <p aria-hidden='true' className='overflow-hidden font-mono text-xs tracking-widest text-colour9 md:w-[calc(50%-2rem)]'>
            {machineLine(travellers)}
          </p>
        ) : null}
      </div>
    </PassportLeaf>
  );
}

export default PassportPhotoPage;
