import React, { useState } from 'react';
// Api
import { makeMainMap } from '@/api/travelApi';
// Components
import MapActionButton from './MapActionButton';
import VerifyFirstNote from './VerifyFirstNote';
// Utils
import { forgetMapLists } from '@/utils/map/mapListCache';

// The owner's choice of main map (POST /maps/:mapId/main): every plan includes one map,
// the rest are extra maps that need paying for. Making this one the main map unlocks it,
// and the old main map becomes an extra map. Shown for a map that isn't the main one.
// `locked`: the email address isn't verified yet, so it says that instead.
function MainMapSection({ map, locked = false, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const makeMain = async () => {
    setBusy(true);
    setError(null);
    try {
      await makeMainMap(map.id);
      forgetMapLists();
      await onChanged?.();
    } catch (err) {
      setError(err.friendlyMessage || 'That didn’t work. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='main-map-heading'>
      <h3 id='main-map-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Main map
      </h3>
      <p className='text-sm opacity-80'>
        Your plan includes one map; the others are extra maps. Make “{map.name}” the included one, and your current main map
        becomes an extra map.
      </p>
      {locked ? (
        <VerifyFirstNote action='choose your main map' />
      ) : (
        <MapActionButton quiet busy={busy} onClick={makeMain}>
          Make this my main map
        </MapActionButton>
      )}
      {error ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error}
        </p>
      ) : null}
    </section>
  );
}

export default MainMapSection;
