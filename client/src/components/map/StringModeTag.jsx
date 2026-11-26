import React, { useEffect } from 'react';
// Components
import LuggageTag from './LuggageTag';
import MapActionButton from './MapActionButton';
// Utils
import { countryName } from '@/utils/map/countries';

/**
 * String mode's tag at the foot of the map (docs/API.md "Strings"; 23 Nov 2026, the user's
 * wish): says what to do next and what just happened (`message`, read out as it changes),
 * with "Done" (and Escape) to leave. `startCode`: the place chosen first, waiting for the second.
 * `kind`: the strings being tied, the visited ones or the planned ones (25 Nov 2026).
 */
function StringModeTag({ kind = 'VISITED', startCode = null, message = '', error = false, onDone }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) onDone();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDone]);

  const next = startCode ? `From ${countryName(startCode)}: click the country to tie it to.` : 'Click a country to start a string. Click a string to take it off.';
  return (
    <LuggageTag as='section' aria-label='String mode' className='max-w-[min(26rem,calc(100vw-1.5rem))] text-sm' data-string-mode={kind}>
      <span className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3'>
        <span className='grid gap-1'>
          <span className='font-semibold'>{kind === 'PLANNED' ? 'String mode: planned strings' : 'String mode'}</span>
          <span role='status' aria-live='polite' className={error ? 'font-medium text-status-critical' : ''}>
            {message || next}
          </span>
          {message ? <span className='text-xs'>{next}</span> : null}
        </span>
        <span className='pointer-events-auto'>
          <MapActionButton onClick={onDone}>Done</MapActionButton>
        </span>
      </span>
    </LuggageTag>
  );
}

export default StringModeTag;
