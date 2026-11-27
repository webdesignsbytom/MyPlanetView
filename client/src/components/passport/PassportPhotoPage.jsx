import React from 'react';
// Components
import PassportLeaf from './PassportLeaf';
import PassportPortrait from './PassportPortrait';
import PassportSignature from './PassportSignature';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';
import { fullName, machineLine, passportNumber } from '@/utils/passport/travellerDetails';

const LABEL = 'font-travel text-xs uppercase tracking-wide text-colour9';
const ACTION = 'underline underline-offset-2 disabled:no-underline disabled:opacity-50';

// One detail: its label, then the value (a place's name, or "Not given"); `grouped` in the
// two columns under the photo, where each label and value keep together
function Detail({ label, children, grouped = false }) {
  const pair = (
    <>
      <dt className={LABEL}>{label}</dt>
      <dd className='break-words'>{children}</dd>
    </>
  );
  return grouped ? <div className='grid content-start'>{pair}</div> : pair;
}

const placeName = (code) => (code ? countryName(code) : 'Not given');

/**
 * The passport's photo page: each traveller on the map laid out as a passport's holder (25 Nov
 * 2026, the user's wish: "improve passport page for user avatars and info"): their photo
 * (PassportPortrait: one of the map's photos cropped to the box, else their account's picture,
 * else their initials) with their surname and given names (27 Nov 2026, the user's wish:
 * "Passport needs first name last name"; "Not given" with no last name), nationality (27 Nov
 * 2026, the user's wish), date of birth (the map's editors only: the passport reply has it for
 * no one else) and where they were born beside it; under them, in two columns, home (`home`, the
 * map's), their favourite country, when they started travelling (the year of their first trip),
 * the date of issue (when they were added to the map) and a made-up passport number; then their
 * signature (drawn, else their whole name in a handwriting face). The photo keeps a passport
 * photo's shape: with every detail beside it, it stretched into a thin strip. An editor
 * (`onEditPhoto`, `onEditSignature`) changes the photo and the signature here; `locked` (an
 * unverified address) says why they can't yet.
 */
function PassportPhotoPage({ travellers, home = null, pageNumber, headingId, onEditPhoto = null, onEditSignature = null, locked = false }) {
  const editable = Boolean(onEditPhoto || onEditSignature);
  return (
    <PassportLeaf pageNumber={pageNumber} labelledBy={headingId}>
      {/* Wide screens: the travellers two by two, a page each, clear of the fold; the
          machine-readable line on the left-hand page */}
      <div className='grid content-start gap-5'>
        <h2 id={headingId} className='font-travel text-3xl uppercase leading-tight text-colour6'>
          Travellers
        </h2>
        {editable && locked ? <p className='text-sm'>Verify your email address to add photos and signatures.</p> : null}
        {travellers.length ? (
          <ul className='grid gap-4 md:grid-cols-2 md:gap-x-16'>
            {travellers.map((traveller) => (
              <li key={traveller.id} className='grid content-start gap-3 border-2 border-colour9/50 p-3' data-passport-traveller={traveller.id}>
                {/* The photo box as tall as the details beside it, to their last line (24 Nov 2026,
                    the user's wish: a 3:4 box stopped a line short), and never shorter than 3:4 */}
                <div className='grid grid-cols-[6rem_minmax(0,1fr)] gap-4'>
                  <PassportPortrait name={fullName(traveller)} photo={traveller.photo} className='min-h-[8rem]' />
                  <dl className='grid min-w-0 content-start gap-1 text-sm' data-beside-photo=''>
                    <dt className={LABEL}>Surname</dt>
                    <dd className='break-words font-semibold' data-passport-surname=''>
                      {traveller.lastName || 'Not given'}
                    </dd>
                    <dt className={LABEL}>Given names</dt>
                    <dd className='break-words font-semibold' data-passport-given-names=''>
                      {traveller.name}
                    </dd>
                    {/* 27 Nov 2026, the user's wish: "Passport also needs nationality" */}
                    <dt className={LABEL}>Nationality</dt>
                    <dd className='break-words' data-passport-nationality=''>
                      {placeName(traveller.nationalityCode)}
                    </dd>
                    {traveller.birthDate ? <Detail label='Date of birth'>{formatDay(traveller.birthDate)}</Detail> : null}
                    <Detail label='Born in'>{placeName(traveller.birthCountryCode)}</Detail>
                  </dl>
                </div>
                <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                  {home ? (
                    <Detail grouped label='Home'>
                      {countryName(home)}
                    </Detail>
                  ) : null}
                  <Detail grouped label='Favourite country'>
                    {placeName(traveller.favouriteCountryCode)}
                  </Detail>
                  {traveller.travellingSince ? (
                    <Detail grouped label='Travelling since'>
                      {traveller.travellingSince.slice(0, 4)}
                    </Detail>
                  ) : null}
                  {traveller.issuedOn ? (
                    <Detail grouped label='Date of issue'>
                      {formatDay(traveller.issuedOn)}
                    </Detail>
                  ) : null}
                  <Detail grouped label='Passport no.'>
                    <span className='font-mono tracking-wider'>{passportNumber(traveller.id)}</span>
                  </Detail>
                </dl>
                <div className='grid gap-1 border-t border-dashed border-colour9/50 pt-2'>
                  <p className={LABEL}>Signature</p>
                  <PassportSignature name={fullName(traveller)} signature={traveller.signature} />
                </div>
                {editable ? (
                  <div className='grid grid-row justify-start gap-4 text-sm'>
                    {onEditPhoto ? (
                      <button type='button' disabled={locked} onClick={() => onEditPhoto(traveller)} className={ACTION}>
                        {traveller.photo?.source === 'MAP' ? 'Change the photo' : 'Choose a photo'}
                        <span className='sr-only'> of {traveller.name}</span>
                      </button>
                    ) : null}
                    {onEditSignature ? (
                      <button type='button' disabled={locked} onClick={() => onEditSignature(traveller)} className={ACTION}>
                        {traveller.signature ? 'Sign again' : 'Sign'}
                        <span className='sr-only'> as {traveller.name}</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
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
