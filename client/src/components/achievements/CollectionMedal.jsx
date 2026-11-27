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
 * A medal itself, decorative: in its metal with a tick once earned, else a dashed ring in the
 * metal's colour. `large`: the badge's own card (BadgeStoryDialog). `className` adds to it.
 */
export function MedalFace({ tier, earned, large = false, className = '' }) {
  return (
    <span
      aria-hidden='true'
      className={`relative grid place-items-center rounded-full ${large ? 'h-32 w-32 border-8' : 'h-12 w-12 border-4'} ${
        earned ? `border-double text-poster-ink shadow-paper ${METAL[tier]}` : `border-dashed ${OUTLINE[tier]}`
      } ${className}`}
    >
      <FaMedal className={large ? 'text-5xl' : 'text-lg'} />
      {earned ? (
        <span
          className={`absolute grid place-items-center rounded-full border-2 border-poster-cream bg-poster-red-strong text-poster-cream ${
            large ? '-right-0.5 -top-0.5 h-9 w-9 text-base' : '-right-1 -top-1 h-4 w-4 text-[0.5rem]'
          }`}
        >
          <FaCheck />
        </span>
      ) : null}
    </span>
  );
}

/**
 * One tier of a country's collection (CountryCollections): a medal in its metal once earned,
 * with a tick and when; before that a dashed ring in the metal's colour and how far along it
 * is ("12 of 30"). The words say which, so colour never has to. `onOpen(badge)`: an earned
 * medal is a button opening its own card (BadgeStoryDialog; 27 Nov 2026).
 */
function CollectionMedal({ badge, onOpen = null }) {
  const earned = Boolean(badge.earnedAt || badge.earned);
  const words = collectionWords(badge.key);
  const content = (
    <>
      <MedalFace tier={badge.tier} earned={earned} />
      <span className='text-xs font-semibold leading-tight'>{COLLECTION_TIER_LABELS[badge.tier]}</span>
      <span className={`text-2xs leading-tight ${earned ? 'font-medium text-poster-red-deep' : ''}`}>
        {earned ? (badge.earnedAt ? `Earned ${formatDay(badge.earnedAt)}` : 'Earned') : `${badge.have} of ${badge.need}`}
      </span>
      {words ? <span className='sr-only'>{words.description}</span> : null}
    </>
  );
  return (
    <li className='grid content-start justify-items-center gap-1 text-center' title={words?.description || undefined} data-medal={badge.tier} data-earned={earned ? '' : undefined}>
      {earned && onOpen ? (
        <button
          type='button'
          onClick={() => onOpen(badge)}
          aria-haspopup='dialog'
          className='grid content-start justify-items-center gap-1 rounded-lg p-0.5 text-center transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
          data-badge-open={badge.key}
        >
          {content}
        </button>
      ) : (
        content
      )}
    </li>
  );
}

export default CollectionMedal;
