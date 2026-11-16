import React, { useState } from 'react';
// Components
import PassportLeaf from './PassportLeaf';
import EntryStamp from './EntryStamp';
import PassportStamp from './PassportStamp';
import StampOutline from './StampOutline';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';

// How many landmarks still to stamp show before "Show all" (Italy has 58)
const FIRST_TO_STAMP = 12;

function statusLine({ status, enteredOn }) {
  const date = enteredOn ? formatDay(enteredOn) : null;
  if (status === 'LIVED') return date ? `Lived there, from ${date}` : 'Lived there';
  if (status === 'VISITED') return date ? `Visited, first on ${date}` : 'Visited';
  return date ? `Stamped from photos, the first on ${date}` : 'Stamped from photos';
}

/**
 * A visa page: one country (or special place), as a spread on wide screens. On the left,
 * the country's name, its entry stamp and the landmarks still to stamp (dotted outlines,
 * so the book is also a checklist); on the right, a stamp for each landmark photographed,
 * in the order they were stamped.
 */
function PassportVisaPage({ page, pageNumber, headingId, canPick, locked, onOpenPhoto, onPickPhoto }) {
  const [allToStamp, setAllToStamp] = useState(false);
  const name = countryName(page.countryCode);
  const toStamp = allToStamp ? page.toStamp : page.toStamp.slice(0, FIRST_TO_STAMP);
  const toStampId = `${headingId}-to-stamp`;
  const stampsId = `${headingId}-stamps`;

  return (
    <PassportLeaf pageNumber={pageNumber} labelledBy={headingId}>
      {/* Phones: the country, its stamps, then what's left to stamp. Wide screens: a spread,
          the stamps on the right-hand page */}
      <div className='grid content-start gap-6 md:grid-cols-2 md:grid-rows-[auto_minmax(0,1fr)]'>
        <div className='grid content-start gap-5 md:col-start-1 md:row-start-1 md:pr-6'>
          <header className='grid gap-1'>
            <p className='font-travel text-xs uppercase tracking-xl text-colour9'>Visa</p>
            <h2 id={headingId} className='font-travel text-3xl uppercase leading-tight text-colour6'>
              {name}
            </h2>
            <p className='text-sm'>{statusLine(page)}</p>
          </header>
          <div className='grid justify-items-center px-4'>
            <EntryStamp countryCode={page.countryCode} status={page.status} enteredOn={page.enteredOn} />
          </div>
        </div>

        <section aria-labelledby={stampsId} className='grid content-start gap-4 md:col-start-2 md:row-span-2 md:row-start-1 md:border-l-2 md:border-dashed md:border-colour9/40 md:pl-6'>
          <h3 id={stampsId} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
            Landmark stamps <span className='font-main text-sm normal-case tracking-normal'>({page.stamps.length})</span>
          </h3>
          {page.stamps.length ? (
            <ul className='grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-4 gap-y-6'>
              {page.stamps.map((stamp) => (
                <PassportStamp
                  key={stamp.landmarkId}
                  stamp={stamp}
                  canPick={canPick}
                  locked={locked}
                  onOpenPhoto={onOpenPhoto}
                  onPickPhoto={(picked) => onPickPhoto(picked, page.countryCode)}
                />
              ))}
            </ul>
          ) : (
            <p className='text-sm'>
              No landmark stamped in {name} yet. A landmark is stamped when one of the map’s photos of it is confirmed: open a photo
              from {name} and say which landmark it shows.
            </p>
          )}
        </section>

        {page.toStamp.length ? (
          <section aria-labelledby={toStampId} className='grid content-start gap-2 md:col-start-1 md:row-start-2 md:pr-6'>
            <h3 id={toStampId} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
              Still to stamp <span className='font-main text-sm normal-case tracking-normal'>({page.toStamp.length})</span>
            </h3>
            <ul id={`${toStampId}-list`} className='grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2'>
              {toStamp.map((landmark) => (
                <li
                  key={landmark.id}
                  className='grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-2 rounded-md border-2 border-dotted border-colour9/60 px-2 py-1 text-xs'
                >
                  <StampOutline landmarkId={landmark.id} />
                  <span>
                    {landmark.name}
                    {landmark.isUnesco ? <span className='sr-only'> (UNESCO World Heritage Site)</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            {page.toStamp.length > FIRST_TO_STAMP ? (
              <button
                type='button'
                aria-expanded={allToStamp}
                aria-controls={`${toStampId}-list`}
                onClick={() => setAllToStamp((open) => !open)}
                className='justify-self-start text-sm font-semibold text-colour6 underline underline-offset-2'
              >
                {allToStamp ? 'Show fewer' : `Show all ${page.toStamp.length}`}
              </button>
            ) : null}
          </section>
        ) : null}
      </div>
    </PassportLeaf>
  );
}

export default PassportVisaPage;
