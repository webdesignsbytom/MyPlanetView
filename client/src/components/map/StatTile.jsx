import React from 'react';

// One number in the stats panel, on a ticket stub with a dashed brown edge; `outOf` adds
// the most there can be ("3 of 7"), `unit` a small word after it ("km"), `note` a line under
// it ("about 30,000 miles"); `compact` sets a word (a country's name) smaller than a number
function StatTile({ label, value, outOf, unit, note, compact = false }) {
  return (
    <div className='grid content-start gap-0.5 border-2 border-dashed border-poster-brown/60 px-3 py-2'>
      <dt className='font-travel text-sm uppercase tracking-wide text-colour9'>{label}</dt>
      <dd className={`font-travel leading-none text-colour6 ${compact ? 'text-xl' : 'text-3xl'}`}>
        {value ?? 0}
        {unit ? <span className='font-main text-sm text-colour9'> {unit}</span> : null}
        {outOf ? <span className='font-main text-sm text-colour9'> of {outOf}</span> : null}
      </dd>
      {note ? <dd className='text-xs text-colour9'>{note}</dd> : null}
    </div>
  );
}

export default StatTile;
