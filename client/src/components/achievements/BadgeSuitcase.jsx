import React, { useId } from 'react';
// Components
import BadgeSticker from './BadgeSticker';
import CountryCollections from './CountryCollections';
// Utils
import { BADGE_GROUPS, badgeGroupLabel } from '@/utils/achievements/badges';
import { COLLECTION_GROUP } from '@/utils/achievements/collections';

/**
 * The map's site badges as luggage stickers on an old suitcase (docs/FEATURE-PLAN.md,
 * "Site badges"): a leather-edged case with a handle, the stickers grouped as the server
 * groups them (countries, continents, special places, regions, landmarks, photos), the
 * earned ones stuck on and the rest outlined where they'll go. A group the client
 * doesn't know yet still shows, last, under its own name. `note` replaces the line under
 * the heading (a traveller's suitcase says where their badges come from); `children` sit
 * between the heading and the case (the panel's "whose badges" switch).
 * The country collections (24 Nov 2026) are a row of medals per place started
 * (CountryCollections); `onShareCollection(place)` shares a place's best medal as a picture.
 */
function BadgeSuitcase({ badges, note = null, onShareCollection = null, children = null }) {
  const headingId = useId();
  const earned = badges.filter((b) => b.earnedAt || b.earned).length;
  const known = BADGE_GROUPS.map((g) => g.id);
  const groups = [...known, ...new Set(badges.map((b) => b.group).filter((g) => !known.includes(g)))]
    .map((id) => ({ id, badges: badges.filter((b) => b.group === id) }))
    .filter((group) => group.badges.length);

  return (
    <section className='grid gap-2' aria-labelledby={headingId}>
      <h3 id={headingId} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Badges
      </h3>
      {children}
      <p className='text-sm'>
        {earned} of {badges.length} earned. {note || 'Each is a sticker on the suitcase once it’s yours.'}
      </p>
      <div className='grid justify-items-center'>
        {/* The handle */}
        <span aria-hidden='true' className='h-5 w-24 rounded-t-2xl border-4 border-b-0 border-poster-brown' />
        <div className='paper-aged grid w-full gap-6 rounded-2xl border-4 border-poster-brown px-3 py-4 text-poster-ink shadow-paper'>
          {groups.map((group) => (
            <section key={group.id} className='grid gap-5' aria-labelledby={`${headingId}-${group.id}`}>
              <h4
                id={`${headingId}-${group.id}`}
                className='border-b-2 border-dashed border-poster-brown/50 pb-1 font-travel text-sm uppercase tracking-xl text-poster-brown'
              >
                {badgeGroupLabel(group.id)}
              </h4>
              {group.id === COLLECTION_GROUP ? (
                <CountryCollections badges={group.badges} onShare={onShareCollection} />
              ) : (
                <ul className='grid grid-cols-3 gap-x-2 gap-y-3'>
                  {group.badges.map((badge, index) => (
                    <BadgeSticker key={badge.key} badge={badge} index={index} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BadgeSuitcase;
