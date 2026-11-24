import React, { useState } from 'react';
import { FaCameraRetro, FaFlagCheckered, FaMapMarkedAlt, FaSuitcaseRolling } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// Constants
import { tripPath } from '@/utils/constants/routes';
// API
import { createStop } from '@/api/travelApi';
// Utils
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { firstStopFor } from '@/utils/trips/plannedTrips';
// Components
import MapPanel from '@/components/map/MapPanel';
import MapActionButton from '@/components/map/MapActionButton';
import TripCard from './TripCard';
import TripForm from './TripForm';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import PanelEmptyState from '@/components/map/PanelEmptyState';

// The map's trips, planned and done, with the group trips added to it from other maps
// (marked as such); editors can start a new one (`locked`: once their email address is
// verified). `onRemoveLinked(tripId)` (the map's owner) takes a group trip off the map. With
// no trips yet, a passport page waiting for its first stamp (PanelEmptyState) says what a
// trip does, with "Plan a new trip" on it for an editor.
// `planCountry`: opened from a place's ticket ("Plan a trip", 22 Nov 2026, the user's wish):
// the form is open at once, titled for it, and the new trip gets the place as its first stop.
// `onFlights` opens the flight log (scanning a boarding pass fills in a trip; 23 Nov 2026).
function TripsPanel({ trips, travellers, canEdit, locked = false, onCreate, planCountry = null, noLinks = false, onRemoveLinked = null, onFlights = null, onClose }) {
  const navigate = useNavigate();
  const planPlace = canEdit && planCountry ? COUNTRY_BY_CODE[planCountry] : null;
  const [creating, setCreating] = useState(Boolean(planPlace));
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

  const empty = !trips.length && !creating;
  const planButton = <MapActionButton onClick={() => setCreating(true)}>Plan a new trip</MapActionButton>;

  return (
    <MapPanel title='Trips' onClose={onClose} fill={empty}>
      <div className={`grid gap-4 ${empty ? (locked || error ? 'grid-rows-[auto_minmax(0,1fr)]' : 'grid-rows-[minmax(0,1fr)]') : 'content-start'}`}>
      {creating ? (
        <div className='grid gap-3 border-2 border-dashed border-poster-brown/60 p-3'>
          {planPlace ? (
            <p className='text-sm'>
              A trip to {planPlace.name}: it starts with {planPlace.name} as its first stop, and you can add more on the trip’s page.
            </p>
          ) : null}
          <TripForm
            initial={planPlace ? { title: `Trip to ${planPlace.name}` } : undefined}
            travellers={travellers}
            onCancel={() => setCreating(false)}
            onSubmit={async (body) => {
              const trip = await onCreate(body);
              // The place as its first stop; if that fails, the trip is still there to add it on its page
              if (planPlace) await createStop(trip.id, firstStopFor(planPlace.code, planPlace.name)).catch(() => {});
              navigate(tripPath(trip.id));
            }}
          />
        </div>
      ) : canEdit && !empty ? (
        // Half the panel's gap between the two (24 Nov 2026, the user's wish)
        <div className='grid gap-2' data-trip-actions>
          {planButton}
          {onFlights ? (
            <MapActionButton quiet onClick={onFlights}>
              Scan a boarding pass
            </MapActionButton>
          ) : null}
        </div>
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
      ) : empty ? (
        <PanelEmptyState
          icon={<FaSuitcaseRolling />}
          title={canEdit || locked ? 'Where to next?' : 'No trips yet'}
          text={
            canEdit || locked
              ? 'A trip keeps where you went, when, and who came along.'
              : 'When trips are added to this map, they show up here.'
          }
          steps={
            canEdit || locked
              ? [
                  { icon: <FaMapMarkedAlt />, text: 'Add its stops: countries, landmarks and places, with dates.' },
                  { icon: <FaCameraRetro />, text: 'Add its photos, and they become the trip’s album.' },
                  { icon: <FaFlagCheckered />, text: 'Mark it completed, and its countries are marked visited.' },
                ]
              : []
          }
        >
          {canEdit ? planButton : null}
        </PanelEmptyState>
      ) : null}
      </div>
    </MapPanel>
  );
}

export default TripsPanel;
