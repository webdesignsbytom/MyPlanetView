import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Constants
import { tripPath } from '@/utils/constants/routes';
// Components
import MapPanel from '@/components/map/MapPanel';
import MapActionButton from '@/components/map/MapActionButton';
import TripCard from './TripCard';
import TripForm from './TripForm';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';

// The map's trips, planned and done, with the group trips added to it from other maps
// (marked as such); editors can start a new one (`locked`: once their email address is
// verified). `onRemoveLinked(tripId)` (the map's owner) takes a group trip off the map.
function TripsPanel({ trips, travellers, canEdit, locked = false, onCreate, noLinks = false, onRemoveLinked = null, onClose }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState(null);

  const remove = async (trip) => {
    setRemovingId(trip.id);
    setError(null);
    try {
      await onRemoveLinked(trip.id);
    } catch (err) {
      setError(err.friendlyMessage || 'The trip could not be taken off the map.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <MapPanel title='Trips' onClose={onClose}>
      {creating ? (
        <div className='grid border-2 border-dashed border-poster-brown/60 p-3'>
          <TripForm
            travellers={travellers}
            onCancel={() => setCreating(false)}
            onSubmit={async (body) => {
              const trip = await onCreate(body);
              navigate(tripPath(trip.id));
            }}
          />
        </div>
      ) : canEdit ? (
        <MapActionButton onClick={() => setCreating(true)}>Plan a new trip</MapActionButton>
      ) : locked ? (
        <VerifyFirstNote action='plan a trip' />
      ) : null}

      {error ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error}
        </p>
      ) : null}
      {trips.length ? (
        <ul className='grid gap-2'>
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              noLink={noLinks}
              onRemove={trip.linked && onRemoveLinked ? () => remove(trip) : undefined}
              removing={removingId === trip.id}
            />
          ))}
        </ul>
      ) : (
        <p className='text-sm opacity-80'>No trips yet.</p>
      )}
    </MapPanel>
  );
}

export default TripsPanel;
