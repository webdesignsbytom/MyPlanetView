import React, { useState } from 'react';
// Api
import { deleteMap } from '@/api/travelApi';
// Components
import MapActionButton from './MapActionButton';
import VerifyFirstNote from './VerifyFirstNote';

// Deleting a map you own (not your default one): everything on it goes, photos included.
// `locked`: the email address isn't verified yet, so it says that instead.
function DeleteMapSection({ map, locked = false, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteMap(map.id);
      onDeleted();
    } catch (err) {
      setError(err.friendlyMessage || 'The map could not be deleted.');
      setBusy(false);
    }
  };

  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='delete-map-heading'>
      <h3 id='delete-map-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Delete this map
      </h3>
      <p className='text-sm opacity-80'>
        Every trip, photo and visited country on “{map.name}” is deleted for good, for everyone it’s shared with.
      </p>
      {locked ? (
        <VerifyFirstNote action='delete a map' />
      ) : confirming ? (
        <div className='grid grid-row gap-2'>
          <MapActionButton danger busy={busy} onClick={handleDelete}>
            Yes, delete it
          </MapActionButton>
          <MapActionButton quiet onClick={() => setConfirming(false)}>
            Keep it
          </MapActionButton>
        </div>
      ) : (
        <MapActionButton danger onClick={() => setConfirming(true)}>
          Delete map
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

export default DeleteMapSection;
