import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaBalanceScale, FaCalendarAlt, FaMedal, FaPassport, FaPlane, FaPrint, FaQuestionCircle, FaShareAlt, FaSuitcase } from 'react-icons/fa';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import StatTile from './StatTile';
import StatsTimeAway from './StatsTimeAway';
import CollectorCounts from './CollectorCounts';
import UnplacedPhotosButton from './UnplacedPhotosButton';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';
import useDistanceUnit from '@/hooks/useDistanceUnit';
// Utils
import { CONTINENT_TOTAL, SPECIAL_PLACE_TOTAL } from '@/utils/map/specialPlaces';
import { REGION_CODES } from '@/utils/map/regionPlaces';
import { countryName } from '@/utils/map/countries';
import { aboutDistance, aboutDistanceWords, dayWords, withThe, worldShare } from '@/utils/map/travelStatWords';
import { distanceSentence } from '@/utils/map/distanceComparisons';
import { lifeShareWords } from '@/utils/map/birthDates';

// Travel statistics, counted by the server from what this viewer may see. Countries
// leave out the special places (Antarctica and the poles), which have their own count;
// continents count them (Antarctica is the seventh). Regions (Bali, Tasmania) have their own
// count too, and open no continent (their country does). The photos with no country
// (counted, but on no country) are a button away, and so are the badges and goals (on a
// phone, the toolbar leaves their stamp out: MapToolbar). `passportHref` links to the map's
// passport (its own address, or through the share link).
// `onShareCard` makes a picture of the map to share (ShareCardDialog), `onPoster` the map as a
// printed poster (MapPosterDialog, 22 Nov 2026); `compareHref` the compare page with this
// map first (22 Nov 2026); `vsHref` Vs mode, you and friends compared with medals (26 Nov
// 2026); `onYearRecap` opens
// "Your year in travel" (YearRecapDialog). `collected` (the map's landmark marks: stamped and
// ticked Sets) counts the collection (docs/API.md "Collecting"): the landmarks been to, and
// the World Heritage Sites among them, out of all there are. Then how far they've gone
// (docs/API.md "Stats"; 21 Nov 2026): the share of the world's countries, the days away and
// the distance on completed trips (home, the stops, home again), and the place furthest from
// the map's home (Settings, "This map"). Time away in more detail (23 Nov 2026, the user's
// wish): the longest trip, the days away each year and in each country (StatsTimeAway), and
// each traveller's days beside their countries. Collector's counts (24 Nov 2026): the UN's 193
// member states been to, from the map's `visits`, with the ones to go, each opening its ticket
// (`onOpenCountry`). Distances are in the map's unit (useDistanceUnit: kilometres, or miles for
// an American map or by choice; 24 Nov 2026, the user's wish), the other under it, and a line
// says what the distance travelled is like ("27,300 km is nearly as far as the Pan-American
// Highway": utils/map/distanceComparisons.js).
function StatsPanel({ stats, travellers = [], visits = [], onOpenCountry = null, unplacedCount = 0, unplacedMore = false, onShowUnplaced, onShowBadges, onShareCard, onPoster, onGuessGame, onFlightLog, compareHref, vsHref, onYearRecap, collected = null, passportHref, onClose }) {
  const byTraveller = stats?.byTraveller || [];
  const unit = useDistanceUnit();
  const distance = aboutDistance(stats?.distanceKm, unit);
  const distanceLike = stats?.distanceKm ? distanceSentence(stats.distanceKm, unit) : null;
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
            {stats.longestTrip ? <StatTile label='Longest trip' value={dayWords(stats.longestTrip.days)} compact note={stats.longestTrip.title} /> : null}
            <StatTile
              label='Distance travelled'
              value={distance.value}
              unit={distance.unit}
              note={stats.distanceKm ? `About ${distance.other}` : 'Home and back, to everywhere you’ve been'}
            />
            {stats.furthest ? (
              <StatTile
                label='Furthest from home'
                value={countryName(stats.furthest.countryCode)}
                compact
                note={`About ${aboutDistanceWords(stats.furthest.km, unit)} from ${withThe(countryName(stats.homeCountryCode))}`}
              />
            ) : null}
          </dl>
          {/* What the distance is like: round the world, to the Moon (24 Nov 2026, the user's wish) */}
          {distanceLike ? (
            <p className='text-sm text-colour9' data-distance-comparison>
              {distanceLike}
            </p>
          ) : null}
          {onShareCard ? (
            <MapActionButton onClick={onShareCard}>
              <FaShareAlt aria-hidden='true' />
              <span>Share a picture of my map</span>
            </MapActionButton>
          ) : null}
          {onPoster ? (
            <MapActionButton quiet onClick={onPoster}>
              <FaPrint aria-hidden='true' />
              <span>A poster of my map</span>
            </MapActionButton>
          ) : null}
          {/* The flight log (23 Nov 2026): flights, airports and distance, from boarding passes */}
          {onFlightLog ? (
            <MapActionButton quiet onClick={onFlightLog}>
              <FaPlane aria-hidden='true' />
              <span>Flight log</span>
            </MapActionButton>
          ) : null}
          {/* "Guess where I was" (23 Nov 2026): a game of the map's photos for friends */}
          {onGuessGame ? (
            <MapActionButton quiet onClick={onGuessGame}>
              <FaQuestionCircle aria-hidden='true' />
              <span>Guess where I was: a game for friends</span>
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
          {compareHref ? (
            <Link
              to={compareHref}
              className='btn-paper grid-flow-col justify-center gap-2 text-center [grid-auto-columns:minmax(0,max-content)] [--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.25rem] [--btn-size:1.0625rem]'
            >
              <FaBalanceScale aria-hidden='true' />
              <span>Compare with another map</span>
            </Link>
          ) : null}
          {/* Vs mode (26 Nov 2026, the user's wish): you and up to seven friends, with medals */}
          {vsHref ? (
            <Link
              to={vsHref}
              className='btn-paper grid-flow-col justify-center gap-2 text-center [grid-auto-columns:minmax(0,max-content)] [--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.25rem] [--btn-size:1.0625rem]'
            >
              <FaMedal aria-hidden='true' />
              <span>Vs mode: compare with friends</span>
            </Link>
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
          {/* The UN's 193, beside the map's own count (24 Nov 2026): a counter, the map unchanged */}
          <CollectorCounts count={stats.unCountries ?? null} visits={visits} onOpenCountry={onOpenCountry} />
          <StatsTimeAway daysByYear={stats.daysByYear} daysByPlace={stats.daysByPlace} />
          {travellers.length > 1 && byTraveller.length ? (
            <section className='grid gap-2' aria-labelledby='stats-by-traveller'>
              <h3 id='stats-by-traveller' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
                Each traveller, from completed trips
              </h3>
              <ul className='grid divide-y divide-dashed divide-poster-brown/40 text-sm'>
                {byTraveller.map((row) => (
                  <li key={row.travellerId} data-traveller-stats className='grid grid-cols-rev gap-2 py-1.5'>
                    <span>{row.name}</span>
                    <span className='font-semibold'>
                      {[
                        row.countries === 1 ? '1 country' : `${row.countries} countries`,
                        dayWords(row.daysAway ?? 0),
                        // The share of their life (editors, with a date of birth; 23 Nov 2026)
                        row.daysAway ? lifeShareWords(row.lifeAwayShare) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
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
