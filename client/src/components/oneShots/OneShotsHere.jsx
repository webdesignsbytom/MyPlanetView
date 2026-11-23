import React, { useId, useMemo } from 'react';
import { FaBinoculars, FaCheck } from 'react-icons/fa';
// Hooks
import { useOneShotsHere } from '@/hooks/useOneShots';
// Utils
import { ONE_SHOTS_NAME, ONE_SHOT_TICK_WORDS, oneShotsInPlace, seenWords } from '@/utils/oneShots/oneShotWords';

// How many of the place's still-to-see show before "and N more"
const TO_SEE_SHOWN = 6;

/**
 * Life's One Shots in a country's ticket (CountryPanel; 24 Nov 2026): what the map has seen or
 * done there, and what's usually seen there still to see, each opening it in the panel
 * (`open(itemKey)` from the map page's OneShotsContext). Nothing for a place with neither.
 */
function OneShotsHere({ code, countryName }) {
  const headingId = useId();
  const { oneShots, open } = useOneShotsHere();
  const { seen, toSee } = useMemo(() => oneShotsInPlace(code, oneShots), [code, oneShots]);
  if (!seen.length && !toSee.length) return null;
  const item = (shot, children) =>
    open ? (
      <button type='button' onClick={() => open(shot.key)} className='text-left underline-offset-2 hover:underline'>
        {children}
      </button>
    ) : (
      children
    );
  return (
    <section className='grid gap-2' aria-labelledby={headingId} data-one-shots-here={code}>
      <h3 id={headingId} className='grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        <FaBinoculars aria-hidden='true' className='text-base' />
        <span>{ONE_SHOTS_NAME}</span>
      </h3>
      {seen.length ? (
        <ul className='grid gap-1 text-sm' aria-label={`Seen or done in ${countryName}`}>
          {seen.map(({ item: shot, tick }) => (
            <li key={shot.key} className='grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2'>
              <FaCheck aria-hidden='true' className='translate-y-1 text-poster-red' />
              <span>
                {item(shot, <span className='font-semibold'>{shot.name}</span>)}
                <span className='block text-xs opacity-80'>{`${ONE_SHOT_TICK_WORDS[shot.list]}${seenWords(tick) ? `: ${seenWords(tick)}` : ''}`}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {toSee.length ? (
        <p className='text-sm'>
          <span className='font-medium'>Still to see here: </span>
          {toSee.slice(0, TO_SEE_SHOWN).map((shot, index) => (
            <React.Fragment key={shot.key}>
              {index ? ', ' : ''}
              {item(shot, shot.name)}
            </React.Fragment>
          ))}
          {toSee.length > TO_SEE_SHOWN ? ` and ${toSee.length - TO_SEE_SHOWN} more` : ''}.
        </p>
      ) : null}
    </section>
  );
}

export default OneShotsHere;
