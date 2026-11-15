import React from 'react';
// Components
import MapPanel from './MapPanel';
import StatTile from './StatTile';
import UnplacedPhotosButton from './UnplacedPhotosButton';

// Travel statistics, counted by the server from what this viewer may see. The photos
// with no country (counted, but on no country) are a button away.
function StatsPanel({ stats, travellers = [], unplacedCount = 0, unplacedMore = false, onShowUnplaced, onClose }) {
  const byTraveller = stats?.byTraveller || [];
  return (
    <MapPanel title='Travel statistics' onClose={onClose}>
      {stats ? (
        <>
          <dl className='grid grid-cols-2 gap-3'>
            <StatTile label='Countries' value={stats.countries} />
            <StatTile label='Continents' value={stats.continents} />
            <StatTile label='Photos' value={stats.photos} />
            <StatTile label='Landmarks' value={stats.landmarks} />
            <StatTile label='Trips' value={stats.trips} />
          </dl>
          {onShowUnplaced ? <UnplacedPhotosButton count={unplacedCount} more={unplacedMore} onOpen={onShowUnplaced} /> : null}
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
