import React from 'react';

// One number in the stats panel, on a ticket stub with a dashed brown edge
function StatTile({ label, value }) {
  return (
    <div className='grid gap-0.5 border-2 border-dashed border-poster-brown/60 px-3 py-2'>
      <dt className='font-travel text-sm uppercase tracking-wide text-colour9'>{label}</dt>
      <dd className='font-travel text-3xl leading-none text-colour6'>{value ?? 0}</dd>
    </div>
  );
}

export default StatTile;
