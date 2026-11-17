import React, { useState } from 'react';
import { FaCameraRetro, FaFlagCheckered, FaMapMarkedAlt, FaSuitcaseRolling } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// Constants
import { tripPath } from '@/utils/constants/routes';
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

  const empty = !trips.length && !creating;
  const planButton = <MapActionButton onClick={() => setCreating(true)}>Plan a new trip</MapActionButton>;

  return (
    <MapPanel title='Trips' onClose={onClose} fill={empty}>
      <div className={`grid gap-4 ${empty ? (locked || error ? 'grid-rows-[auto_minmax(0,1fr)]' : 'grid-rows-[minmax(0,1fr)]') : 'content-start'}`}>
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
      ) : canEdit && !empty ? (
        planButton
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
