import React from 'react';

// One number in the stats panel
function StatTile({ label, value }) {
  return (
    <div className='grid gap-0.5 rounded-lg border-2 border-map-edge/30 px-3 py-2'>
      <dt className='text-xs font-medium uppercase tracking-xl opacity-80'>{label}</dt>
      <dd className='text-2xl font-semibold'>{value ?? 0}</dd>
    </div>
  );
}

export default StatTile;
