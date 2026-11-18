import React from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaPassport, FaSuitcase } from 'react-icons/fa';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import StatTile from './StatTile';
import UnplacedPhotosButton from './UnplacedPhotosButton';
// Utils
import { CONTINENT_TOTAL, SPECIAL_PLACE_TOTAL } from '@/utils/map/specialPlaces';
import { REGION_CODES } from '@/utils/map/regionPlaces';

// Travel statistics, counted by the server from what this viewer may see. Countries
// leave out the special places (Antarctica and the poles), which have their own count;
// continents count them (Antarctica is the seventh). Regions (Bali, Tasmania) have their own
// count too, and open no continent (their country does). The photos with no country
// (counted, but on no country) are a button away, and so are the badges and goals (on a
// phone, the toolbar leaves their stamp out: MapToolbar). `passportHref` links to the map's
// passport (its own address, or through the share link).
function StatsPanel({ stats, travellers = [], unplacedCount = 0, unplacedMore = false, onShowUnplaced, onShowBadges, passportHref, onClose }) {
  const byTraveller = stats?.byTraveller || [];
  return (
    <MapPanel title='Travel statistics' onClose={onClose}>
      {stats ? (
        <>
          <dl className='grid grid-cols-2 gap-3'>
            <StatTile label='Countries' value={stats.countries} />
            <StatTile label='Continents' value={stats.continents} outOf={CONTINENT_TOTAL} />
            <StatTile label='Special places' value={stats.specialPlaces} outOf={SPECIAL_PLACE_TOTAL} />
            <StatTile label='Regions' value={stats.regions ?? 0} outOf={REGION_CODES.length} />
            <StatTile label='Photos' value={stats.photos} />
            <StatTile label='Landmarks' value={stats.landmarks} />
            <StatTile label='Trips' value={stats.trips} />
          </dl>
          {onShowUnplaced ? <UnplacedPhotosButton count={unplacedCount} more={unplacedMore} onOpen={onShowUnplaced} /> : null}
          {onShowBadges ? (
            <MapActionButton quiet onClick={onShowBadges}>
              <FaSuitcase aria-hidden='true' />
              <span>Badges and goals</span>
            </MapActionButton>
          ) : null}
          {passportHref ? (
            <Link
              to={passportHref}
              className='btn-paper grid-flow-col justify-center gap-2 text-center [grid-auto-columns:minmax(0,max-content)] [--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.25rem] [--btn-size:1.0625rem]'
            >
              <FaPassport aria-hidden='true' />
              <span>Passport: landmark stamps</span>
            </Link>
          ) : null}
          {travellers.length > 1 && byTraveller.length ? (
            <section className='grid gap-2' aria-labelledby='stats-by-traveller'>
              <h3 id='stats-by-traveller' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
                Countries each, from completed trips
              </h3>
              <ul className='grid divide-y divide-dashed divide-poster-brown/40 text-sm'>
                {byTraveller.map((row) => (
                  <li key={row.travellerId} className='grid grid-cols-rev gap-2 py-1.5'>
                    <span>{row.name}</span>
                    <span className='font-semibold'>{row.countries}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <p className='text-sm'>No statistics yet.</p>
      )}
    </MapPanel>
  );
}

export default StatsPanel;
