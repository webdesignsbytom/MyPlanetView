import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Api
import { createMap } from '@/api/travelApi';
// Constants
import { mapPath } from '@/utils/constants/routes';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import MapSwitcherItem from './MapSwitcherItem';
import NewMapForm from './NewMapForm';
import VerifyFirstNote from './VerifyFirstNote';
import TripCard from '@/components/trips/TripCard';
import ExtraMapDialog from '@/components/plans/ExtraMapDialog';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { forgetMapLists, myMaps, sharedTrips as sharedTripList } from '@/utils/map/mapListCache';

// Every map you can open (yours, then ones shared with you), group trips (trips you were
// added to on their own), and a new map. The lists from earlier in the session show at once, and are
// asked for again behind them (utils/map/mapListCache.js).
// A new map needs a free map slot: when every one is used (402), the extra-map dialog
// offers to pay for another, then makes the map (or, after Stripe's checkout, the
// account page does).
function MapSwitcher({ currentMapId, userId, userName, locked = false, onClose }) {
  const navigate = useNavigate();
  const [maps, setMaps] = useState(() => myMaps.peek(userId));
  const [sharedTrips, setSharedTrips] = useState(() => sharedTripList.peek(userId) || []);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  // The new map's body while its extra map is being paid for
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([myMaps.load(userId), sharedTripList.load(userId).catch(() => [])])
      .then(([list, trips]) => {
        if (cancelled) return;
        setMaps(list);
        setSharedTrips(trips);
      })
      .catch((err) => {
        // A list already on screen stays; only an empty switcher says so
        if (!cancelled) setError((prev) => prev || err.friendlyMessage || 'Your maps could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const create = async (body) => {
    const { map } = await createMap(body);
    forgetMapLists();
    onClose();
    navigate(mapPath(map.id));
  };

  // Every map slot is in use (402): pay for another first
  const createOrPay = async (body) => {
    try {
      await create(body);
    } catch (err) {
      if (err.response?.status !== 402) throw err;
      setPaying(body);
    }
  };

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

      {locked && maps ? (
        <VerifyFirstNote action='make another map' />
      ) : creating ? (
        <NewMapForm firstTraveller={userName} onCancel={() => setCreating(false)} onCreate={createOrPay} />
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
            Group trips
          </h3>
          <ul className='grid gap-2'>
            {sharedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} subtitle={trip.mapName} />
            ))}
          </ul>
        </section>
      ) : null}

      {paying ? (
        <ExtraMapDialog
          reason='new'
          pendingMap={paying}
          onClose={() => setPaying(null)}
          onPaid={async () => {
            const body = paying;
            setPaying(null);
            try {
              await create(body);
            } catch (err) {
              setError(err.friendlyMessage || 'The map could not be created.');
            }
          }}
        />
      ) : null}
    </MapPanel>
  );
}

export default MapSwitcher;
