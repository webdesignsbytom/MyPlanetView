import React from 'react';
// Utils
import { plural } from '@/utils/functions/plural';
// Components
import LuggageTag from './LuggageTag';

// The old site's always-on stats box, shrunk to one line on a luggage tag; opens the full
// stats panel (`onIntent`: hovered, focused or pressed, to fetch its code first).
function StatsBadge({ stats, onOpen, onIntent }) {
  if (!stats) return null;
  const countries = plural(stats.countries, 'country', 'countries');
  const continents = plural(stats.continents, 'continent');
  const photos = plural(stats.photos, 'photo');
  return (
    <LuggageTag
      as='button'
      type='button'
      onClick={onOpen}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      onPointerDown={onIntent}
      className='text-sm font-medium transition hover:brightness-105'
      aria-label={`${countries}, ${continents}, ${photos}. Open travel statistics`}
    >
      <span className='grid grid-row items-center gap-2'>
        <span>{countries}</span>
        <span aria-hidden='true' className='text-poster-brown'>·</span>
        <span>{continents}</span>
        <span aria-hidden='true' className='text-poster-brown'>·</span>
        <span>{photos}</span>
      </span>
    </LuggageTag>
  );
}

export default StatsBadge;
