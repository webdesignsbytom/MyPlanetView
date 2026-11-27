import React from 'react';
// Icons
import { FaShareAlt } from 'react-icons/fa';
// Components
import CollectionMedal from './CollectionMedal';
// Utils
import { COLLECTION_TIER_LABELS, collectionPlaces } from '@/utils/achievements/collections';

/**
 * The country collections on the suitcase (BadgeSuitcase; 24 Nov 2026, the user's wish): a
 * row per place the map has started, its name and how many of its landmarks are stamped, then
 * its medals (bronze, silver, gold; a small place has fewer). `onShare(place)` (the map's
 * owner and editors, never a share link) puts a "Share" button by a place with a medal: a
 * picture of it to post (the share card), for word of mouth. `onOpen(badge)`: an earned medal
 * opens its own card (BadgeStoryDialog; 27 Nov 2026).
 */
function CountryCollections({ badges, onShare = null, onOpen = null }) {
  const places = collectionPlaces(badges);
  if (!places.length) return null;
  return (
    <ul className='grid gap-3'>
      {places.map((place) => (
        <li key={place.place} className='grid gap-2 rounded-lg border-2 border-dashed border-poster-brown/40 px-2 py-2.5' data-collection={place.place}>
          <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1'>
            <p className='grid leading-tight'>
              <span className='text-sm font-semibold'>{place.name}</span>
              <span className='text-2xs'>
                {place.have} of {place.total} {place.total === 1 ? 'landmark' : 'landmarks'} stamped
              </span>
            </p>
            {place.best && onShare ? (
              <button
                type='button'
                onClick={() => onShare(place)}
                aria-label={`Share your ${COLLECTION_TIER_LABELS[place.best].toLowerCase()} medal for ${place.name}`}
                className='btn-paper grid-flow-col items-center gap-1.5 [--btn-leading:1rem] [--btn-pad-x:0.625rem] [--btn-pad-y:0.25rem] [--btn-size:0.875rem]'
              >
                <FaShareAlt aria-hidden='true' />
                <span>Share</span>
              </button>
            ) : null}
          </div>
          <ul className='grid grid-cols-3 gap-x-2 gap-y-3' aria-label={`Medals for ${place.name}`}>
            {place.tiers.map((badge) => (
              <CollectionMedal key={badge.key} badge={badge} onOpen={onOpen} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export default CountryCollections;
