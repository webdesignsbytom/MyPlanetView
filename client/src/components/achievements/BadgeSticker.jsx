import React from 'react';
// Icons
import {
  FaCamera,
  FaCheck,
  FaCompass,
  FaGlobe,
  FaGlobeAfrica,
  FaGlobeAmericas,
  FaGlobeAsia,
  FaGlobeEurope,
  FaLandmark,
  FaMapSigns,
  FaSnowflake,
  FaUniversity,
} from 'react-icons/fa';
// Utils
import { badgeWords } from '@/utils/achievements/badges';
import { formatDay } from '@/utils/functions/dates';

const CONTINENT_ICONS = {
  'continent-africa': FaGlobeAfrica,
  'continent-asia': FaGlobeAsia,
  'continent-europe': FaGlobeEurope,
  'continent-north-america': FaGlobeAmericas,
  'continent-south-america': FaGlobeAmericas,
  'continent-oceania': FaGlobeAsia,
};

function iconFor({ key, group }) {
  if (CONTINENT_ICONS[key]) return CONTINENT_ICONS[key];
  if (key === 'antarctica') return FaSnowflake;
  if (key.startsWith('unesco-')) return FaUniversity;
  return { countries: FaGlobe, continents: FaGlobe, special: FaCompass, regions: FaMapSigns, landmarks: FaLandmark, photos: FaCamera }[group] || FaGlobe;
}

// Stickers slapped on at slightly different angles
const TILTS = ['-rotate-6', 'rotate-3', '-rotate-2', 'rotate-6', '-rotate-3', 'rotate-2'];

/**
 * One badge as a luggage sticker on the suitcase (BadgeSuitcase). Earned: a stuck-on
 * sticker in a double red ring, tilted, with a tick and "Earned 12 Mar 2026". Not yet: a
 * dashed outline where it will go, and how far along it is ("3 of 10"). The words say
 * which, so colour never has to. Its description is there for screen readers and as a
 * tooltip.
 */
function BadgeSticker({ badge, index = 0 }) {
  const words = badgeWords(badge.key);
  const earned = Boolean(badge.earnedAt);
  const Icon = iconFor(badge);

  return (
    <li className='grid content-start justify-items-center gap-1 text-center' title={words.description || undefined}>
      <span
        aria-hidden='true'
        className={`relative grid h-16 w-16 place-content-center justify-items-center rounded-full border-4 ${
          earned
            ? `border-double border-poster-red bg-poster-paper text-poster-red shadow-paper ${TILTS[index % TILTS.length]}`
            : 'border-dashed border-poster-brown/50 text-poster-brown/60'
        }`}
      >
        <Icon className='text-xl' />
        {words.short ? <span className='font-travel text-sm leading-none'>{words.short}</span> : null}
        {earned ? (
          <span className='absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-poster-cream bg-poster-red text-2xs text-poster-cream'>
            <FaCheck />
          </span>
        ) : null}
      </span>
      <span className='text-xs font-semibold leading-tight'>{words.name}</span>
      <span className={`text-2xs leading-tight ${earned ? 'font-medium text-poster-red-deep' : ''}`}>
        {earned ? `Earned ${formatDay(badge.earnedAt)}` : `${badge.have} of ${badge.need}`}
      </span>
      {words.description ? <span className='sr-only'>{words.description}</span> : null}
    </li>
  );
}

export default BadgeSticker;
