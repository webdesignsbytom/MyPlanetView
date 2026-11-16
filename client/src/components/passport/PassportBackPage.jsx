import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Components
import PassportLeaf from './PassportLeaf';
import StatTile from '@/components/map/StatTile';
// Utils
import { CONTINENT_TOTAL, SPECIAL_PLACE_TOTAL } from '@/utils/map/specialPlaces';

/**
 * The back page: the passport's totals (countries and special places as the map's stats
 * count them, continents with Antarctica, and the landmarks and UNESCO sites stamped), and
 * how a landmark gets its stamp.
 */
function PassportBackPage({ totals, hasVisas, pageNumber, headingId }) {
  return (
    <PassportLeaf pageNumber={pageNumber} labelledBy={headingId}>
      {/* Wide screens: the totals on the left-hand page, how stamps work on the right */}
      <div className='grid content-start gap-5 md:grid-cols-2 md:gap-x-16'>
        <div className='grid content-start gap-5'>
          <h2 id={headingId} className='font-travel text-3xl uppercase leading-tight text-colour6'>
            Totals
          </h2>
          <dl className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2'>
            <StatTile label='Countries' value={totals.countries} />
            <StatTile label='Continents' value={totals.continents} outOf={CONTINENT_TOTAL} />
            <StatTile label='Special places' value={totals.specialPlaces} outOf={SPECIAL_PLACE_TOTAL} />
            <StatTile label='Landmarks stamped' value={totals.landmarks} />
            <StatTile label='UNESCO sites' value={totals.unesco} />
          </dl>
        </div>
        <div className='grid content-start gap-5 md:pt-12'>
          <section className='grid gap-2 text-sm' aria-labelledby={`${headingId}-how`}>
            <h3 id={`${headingId}-how`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
              How stamps work
            </h3>
            <p>
              {hasVisas ? '' : 'No visa pages yet. '}A country gets its page once it’s marked visited or lived in. A landmark is stamped
              when a photo of it on this map is confirmed (a match from the photo’s location, or one chosen by hand): no photo, no stamp.
              The stamp shows the earliest photo, unless the map’s owner or an editor picks another.
            </p>
          </section>
          <p aria-hidden='true' className='font-travel text-xs uppercase tracking-2xl text-colour9'>
            Issued by {CompanyName}
          </p>
        </div>
      </div>
    </PassportLeaf>
  );
}

export default PassportBackPage;
