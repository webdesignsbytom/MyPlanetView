import React from 'react';
// Utils
import { plural } from '@/utils/functions/plural';
import { SPECIAL_PLACE_TOTAL } from '@/utils/map/specialPlaces';
// Components
import LuggageTag from './LuggageTag';
import { ExpeditionStampIcon } from './StarBadge';

// The old site's always-on stats box, shrunk onto a luggage tag: the countries, continents
// and photos on one line, the special places (Antarctica and the poles) under them with
// their stamp; opens the full stats panel (`onIntent`: hovered, focused or pressed, to
// fetch its code first).
function StatsBadge({ stats, onOpen, onIntent }) {
  if (!stats) return null;
  const countries = plural(stats.countries, 'country', 'countries');
  const continents = plural(stats.continents, 'continent');
  const photos = plural(stats.photos, 'photo');
  const special = `Special places ${stats.specialPlaces ?? 0} of ${SPECIAL_PLACE_TOTAL}`;
  return (
    <LuggageTag
      as='button'
      type='button'
      onClick={onOpen}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      onPointerDown={onIntent}
      className='text-sm font-medium transition hover:brightness-105'
      aria-label={`${countries}, ${continents}, ${photos}. ${special}. Open travel statistics`}
    >
      <span className='grid gap-0.5'>
        <span className='grid grid-row items-center justify-start gap-2'>
          <span>{countries}</span>
          <span aria-hidden='true' className='text-poster-brown'>·</span>
          <span>{continents}</span>
          <span aria-hidden='true' className='text-poster-brown'>·</span>
          <span>{photos}</span>
        </span>
        <span className='grid grid-row items-center justify-start gap-1.5 text-xs'>
          <ExpeditionStampIcon className='h-4 w-4' />
          <span>{special}</span>
        </span>
      </span>
    </LuggageTag>
  );
}

export default StatsBadge;
