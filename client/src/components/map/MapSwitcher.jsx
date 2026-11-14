import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { createMap, getMyMaps, getTripsSharedWithMe } from '@/api/travelApi';
// Constants
import { mapPath } from '@/utils/constants/routes';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import MapSwitcherItem from './MapSwitcherItem';
import NewMapForm from './NewMapForm';
import TripCard from '@/components/trips/TripCard';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// Every map you can open (yours, then ones shared with you), trips shared with you on
// their own, and a new map.
function MapSwitcher({ currentMapId, userName, onClose }) {
  const navigate = useNavigate();
  const [maps, setMaps] = useState(null);
  const [sharedTrips, setSharedTrips] = useState([]);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyMaps(), getTripsSharedWithMe().catch(() => ({ trips: [] }))])
      .then(([{ maps: list }, { trips }]) => {
        if (cancelled) return;
        setMaps(list || []);
        setSharedTrips(trips || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage || 'Your maps could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const own = (maps || []).filter((m) => m.role === 'OWNER');
  const shared = (maps || []).filter((m) => m.role !== 'OWNER');
  const list = (items) => (
    <ul className='grid gap-2'>
      {items.map((map) => (
        <MapSwitcherItem key={map.id} map={map} current={map.id === currentMapId} onPick={onClose} />
      ))}
    </ul>
  );

  return (
    <MapPanel title='Your maps' onClose={onClose}>
      {error ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error}
        </p>
      ) : null}
      {!maps && !error ? (
        <div className='grid place-items-center py-4' role='status'>
          <LoadingSpinner />
          <span className='sr-only'>Loading your maps…</span>
        </div>
      ) : null}

      {own.length ? list(own) : null}

      {creating ? (
        <NewMapForm
          firstTraveller={userName}
          onCancel={() => setCreating(false)}
          onCreate={async (body) => {
            const { map } = await createMap(body);
            onClose();
            navigate(mapPath(map.id));
          }}
        />
      ) : maps ? (
        <MapActionButton onClick={() => setCreating(true)}>New map</MapActionButton>
      ) : null}

      {shared.length ? (
        <section className='grid gap-2' aria-labelledby='maps-shared-heading'>
          <h3 id='maps-shared-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
            Shared with you
          </h3>
          {list(shared)}
        </section>
      ) : null}

      {sharedTrips.length ? (
        <section className='grid gap-2' aria-labelledby='trips-shared-heading'>
          <h3 id='trips-shared-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
            Trips shared with you
          </h3>
          <ul className='grid gap-2'>
            {sharedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} subtitle={trip.mapName} />
            ))}
          </ul>
        </section>
      ) : null}
    </MapPanel>
  );
}

export default MapSwitcher;
