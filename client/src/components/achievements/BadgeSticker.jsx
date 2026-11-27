import React from 'react';
// Icons
import { FaCheck } from 'react-icons/fa';
// Utils
import { badgeWords } from '@/utils/achievements/badges';
import { badgeIcon } from '@/utils/achievements/badgeIcons';
import { formatDay } from '@/utils/functions/dates';

// Stickers slapped on at slightly different angles
const TILTS = ['-rotate-6', 'rotate-3', '-rotate-2', 'rotate-6', '-rotate-3', 'rotate-2'];

/**
 * A badge's sticker itself, decorative: earned, a stuck-on sticker in a double red ring,
 * tilted, with a tick; not yet, a dashed outline where it will go. `large`: the badge's own
 * card (BadgeStoryDialog), drawn big. `className` adds to its ring (an animation).
 */
export function StickerFace({ badge, earned, index = 0, large = false, className = '' }) {
  const words = badgeWords(badge.key);
  const Icon = badgeIcon(badge);
  return (
    <span
      aria-hidden='true'
      className={`relative grid place-content-center justify-items-center rounded-full ${large ? 'h-32 w-32 border-8' : 'h-16 w-16 border-4'} ${
        earned
          ? `border-double border-poster-red bg-poster-paper text-poster-red shadow-paper ${TILTS[index % TILTS.length]}`
          : 'border-dashed border-poster-brown/50 text-poster-brown/60'
      } ${className}`}
    >
      <Icon className={large ? 'text-4xl' : 'text-xl'} />
      {words.short ? <span className={`font-travel leading-none ${large ? 'text-3xl' : 'text-sm'}`}>{words.short}</span> : null}
      {earned ? (
        <span
          className={`absolute grid place-items-center rounded-full border-2 border-poster-cream bg-poster-red-strong text-poster-cream ${
            large ? '-right-0.5 -top-0.5 h-9 w-9 text-base' : '-right-1 -top-1 h-5 w-5 text-2xs'
          }`}
        >
          <FaCheck />
        </span>
      ) : null}
    </span>
  );
}

/**
 * One badge as a luggage sticker on the suitcase (BadgeSuitcase). Earned: a stuck-on
 * sticker in a double red ring, tilted, with a tick and "Earned 12 Mar 2026". Not yet: a
 * dashed outline where it will go, and how far along it is ("3 of 10"). The words say
 * which, so colour never has to. Its description is there for screen readers and as a
 * tooltip. A traveller's badge (BadgesGoalsPanel) has `earned` and the day of the trip that
 * earned it, or no day when that trip had no dates ("Earned").
 * `onOpen(badge)` (27 Nov 2026, the user's wish): an earned sticker is a button opening its own
 * card, the badge and what earned it (BadgeStoryDialog).
 */
function BadgeSticker({ badge, index = 0, onOpen = null }) {
  const words = badgeWords(badge.key);
  const earned = Boolean(badge.earnedAt) || Boolean(badge.earned);
  const content = (
    <>
      <StickerFace badge={badge} earned={earned} index={index} />
      <span className='text-xs font-semibold leading-tight'>{words.name}</span>
      <span className={`text-2xs leading-tight ${earned ? 'font-medium text-poster-red-deep' : ''}`}>
        {earned ? (badge.earnedAt ? `Earned ${formatDay(badge.earnedAt)}` : 'Earned') : `${badge.have} of ${badge.need}`}
      </span>
      {words.description ? <span className='sr-only'>{words.description}</span> : null}
    </>
  );

  return (
    <li className='grid content-start justify-items-center gap-1 text-center' title={words.description || undefined}>
      {earned && onOpen ? (
        <button
          type='button'
          onClick={() => onOpen(badge)}
          aria-haspopup='dialog'
          // The sticker lifts a little under the pointer, so it's plainly something to press
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

export default BadgeSticker;
