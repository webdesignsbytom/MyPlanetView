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

// The map's trips, planned and done; editors can start a new one (`locked`: once their
// email address is verified).
function TripsPanel({ trips, travellers, canEdit, locked = false, onCreate, noLinks = false, onClose }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

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

      {trips.length ? (
        <ul className='grid gap-2'>
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} noLink={noLinks} />
          ))}
        </ul>
      ) : (
        <p className='text-sm opacity-80'>No trips yet.</p>
      )}
    </MapPanel>
  );
}

export default TripsPanel;
