import React from 'react';
// Utils
import { plural } from '@/utils/functions/plural';

// The old site's always-on stats box, shrunk to one line; opens the full stats panel.
function StatsBadge({ stats, onOpen }) {
  if (!stats) return null;
  const countries = plural(stats.countries, 'country', 'countries');
  const continents = plural(stats.continents, 'continent');
  const photos = plural(stats.photos, 'photo');
  return (
    <button
      type='button'
      onClick={onOpen}
      className='pointer-events-auto grid grid-row items-center gap-2 rounded-lg border-2 border-map-edge bg-map-panel px-3 py-1.5 text-sm font-medium text-map-ink shadow-lift-sm hover:brightness-105'
      aria-label={`${countries}, ${continents}, ${photos}. Open travel statistics`}
    >
      <span>{countries}</span>
      <span aria-hidden='true'>·</span>
      <span>{continents}</span>
      <span aria-hidden='true'>·</span>
      <span>{photos}</span>
    </button>
  );
}

export default StatsBadge;
