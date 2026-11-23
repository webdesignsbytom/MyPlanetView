import React from 'react';
// Icons
import { FaCheck, FaMedal } from 'react-icons/fa';
// Utils
import { COLLECTION_TIER_LABELS, collectionWords } from '@/utils/achievements/collections';
import { formatDay } from '@/utils/functions/dates';

// Each metal's disc and rim (fixed colours, like the poster's artwork)
const METAL = {
  bronze: 'border-medal-bronze-edge bg-medal-bronze',
  silver: 'border-medal-silver-edge bg-medal-silver',
  gold: 'border-medal-gold-edge bg-medal-gold',
};
const OUTLINE = {
  bronze: 'border-medal-bronze-edge/60 text-medal-bronze-edge',
  silver: 'border-medal-silver-edge/60 text-medal-silver-edge',
  gold: 'border-medal-gold-edge/60 text-medal-gold-edge',
};

/**
 * One tier of a country's collection (CountryCollections): a medal in its metal once earned,
 * with a tick and when; before that a dashed ring in the metal's colour and how far along it
 * is ("12 of 30"). The words say which, so colour never has to.
 */
function CollectionMedal({ badge }) {
  const earned = Boolean(badge.earnedAt || badge.earned);
  const words = collectionWords(badge.key);
  return (
    <li className='grid content-start justify-items-center gap-1 text-center' title={words?.description || undefined} data-medal={badge.tier} data-earned={earned ? '' : undefined}>
      <span
        aria-hidden='true'
        className={`relative grid h-12 w-12 place-items-center rounded-full border-4 ${
          earned ? `border-double text-poster-ink shadow-paper ${METAL[badge.tier]}` : `border-dashed ${OUTLINE[badge.tier]}`
        }`}
      >
        <FaMedal className='text-lg' />
        {earned ? (
          <span className='absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-poster-cream bg-poster-red text-[0.5rem] text-poster-cream'>
            <FaCheck />
          </span>
        ) : null}
      </span>
      <span className='text-xs font-semibold leading-tight'>{COLLECTION_TIER_LABELS[badge.tier]}</span>
      <span className={`text-2xs leading-tight ${earned ? 'font-medium text-poster-red-deep' : ''}`}>
        {earned ? (badge.earnedAt ? `Earned ${formatDay(badge.earnedAt)}` : 'Earned') : `${badge.have} of ${badge.need}`}
      </span>
      {words ? <span className='sr-only'>{words.description}</span> : null}
    </li>
  );
}

export default CollectionMedal;
