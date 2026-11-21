import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaCalendarAlt, FaPassport, FaShareAlt, FaSuitcase } from 'react-icons/fa';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import StatTile from './StatTile';
import UnplacedPhotosButton from './UnplacedPhotosButton';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';
// Utils
import { CONTINENT_TOTAL, SPECIAL_PLACE_TOTAL } from '@/utils/map/specialPlaces';
import { REGION_CODES } from '@/utils/map/regionPlaces';
import { countryName } from '@/utils/map/countries';
import { aboutKm, aboutMiles, withThe, worldShare } from '@/utils/map/travelStatWords';

// Travel statistics, counted by the server from what this viewer may see. Countries
// leave out the special places (Antarctica and the poles), which have their own count;
// continents count them (Antarctica is the seventh). Regions (Bali, Tasmania) have their own
// count too, and open no continent (their country does). The photos with no country
// (counted, but on no country) are a button away, and so are the badges and goals (on a
// phone, the toolbar leaves their stamp out: MapToolbar). `passportHref` links to the map's
// passport (its own address, or through the share link).
// `onShareCard` makes a picture of the map to share (ShareCardDialog); `onYearRecap` opens
// "Your year in travel" (YearRecapDialog). `collected` (the map's landmark marks: stamped and
// ticked Sets) counts the collection (docs/API.md "Collecting"): the landmarks been to, and
// the World Heritage Sites among them, out of all there are. Then how far they've gone
// (docs/API.md "Stats"; 21 Nov 2026): the share of the world's countries, the days away and
// the distance on completed trips (home, the stops, home again), and the place furthest from
// the map's home (Settings, "This map").
function StatsPanel({ stats, travellers = [], unplacedCount = 0, unplacedMore = false, onShowUnplaced, onShowBadges, onShareCard, onYearRecap, collected = null, passportHref, onClose }) {
  const byTraveller = stats?.byTraveller || [];
  const { landmarks } = useLandmarks(null, { enabled: Boolean(collected) });
  const collection = useMemo(() => {
    if (!collected || !landmarks.length) return null;
    const been = (l) => collected.stamped.has(l.id) || collected.ticked.has(l.id);
    const heritage = landmarks.filter((l) => l.isUnesco);
    return {
      landmarks: landmarks.filter(been).length,
      landmarksTotal: landmarks.length,
      heritage: heritage.filter(been).length,
      heritageTotal: heritage.length,
    };
  }, [collected, landmarks]);
  return (
    <MapPanel title='Travel statistics' onClose={onClose}>
      {stats ? (
        <>
          <dl className='grid grid-cols-2 gap-3'>
            <StatTile label='Countries' value={stats.countries} />
            {stats.countriesInWorld ? (
              <StatTile
                label='Of the world'
                value={worldShare(stats.countries, stats.countriesInWorld)}
                note={`${stats.countries} of ${stats.countriesInWorld} countries`}
              />
            ) : null}
            <StatTile label='Continents' value={stats.continents} outOf={CONTINENT_TOTAL} />
            <StatTile label='Special places' value={stats.specialPlaces} outOf={SPECIAL_PLACE_TOTAL} />
            <StatTile label='Regions' value={stats.regions ?? 0} outOf={REGION_CODES.length} />
            <StatTile label='Photos' value={stats.photos} />
            {collection ? (
              <>
                <StatTile label='Landmarks been to' value={collection.landmarks} outOf={collection.landmarksTotal.toLocaleString('en-GB')} />
                <StatTile label='World Heritage Sites' value={collection.heritage} outOf={collection.heritageTotal.toLocaleString('en-GB')} />
              </>
            ) : (
              <StatTile label='Landmarks' value={stats.landmarks} />
            )}
            <StatTile label='Trips' value={stats.trips} />
            <StatTile label='Days away' value={(stats.daysAway ?? 0).toLocaleString('en-GB')} note='On completed trips' />
            <StatTile
              label='Distance travelled'
              value={aboutKm(stats.distanceKm)}
              unit='km'
              note={stats.distanceKm ? `About ${aboutMiles(stats.distanceKm)}` : 'Home and back, on completed trips'}
            />
            {stats.furthest ? (
              <StatTile
                label='Furthest from home'
                value={countryName(stats.furthest.countryCode)}
                compact
                note={`About ${aboutKm(stats.furthest.km)} km from ${withThe(countryName(stats.homeCountryCode))}`}
              />
            ) : null}
          </dl>
          {onShareCard ? (
            <MapActionButton onClick={onShareCard}>
              <FaShareAlt aria-hidden='true' />
              <span>Share a picture of my map</span>
            </MapActionButton>
          ) : null}
          {onYearRecap ? (
            <MapActionButton quiet onClick={onYearRecap}>
              <FaCalendarAlt aria-hidden='true' />
              <span>Your year in travel</span>
            </MapActionButton>
          ) : null}
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
