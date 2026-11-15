import React from 'react';

// One number in the stats panel, on a ticket stub with a dashed brown edge; `outOf` adds
// the most there can be ("3 of 7")
function StatTile({ label, value, outOf }) {
  return (
    <div className='grid gap-0.5 border-2 border-dashed border-poster-brown/60 px-3 py-2'>
      <dt className='font-travel text-sm uppercase tracking-wide text-colour9'>{label}</dt>
      <dd className='font-travel text-3xl leading-none text-colour6'>
        {value ?? 0}
        {outOf ? <span className='font-main text-sm text-colour9'> of {outOf}</span> : null}
      </dd>
    </div>
  );
}

export default StatTile;
