import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// Api
import { putTripTravellers, updateTrip } from '@/api/travelApi';
// Constants
import { mapPath } from '@/utils/constants/routes';
// Components
import TripForm from './TripForm';
import TripTravellerChips from './TripTravellerChips';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { TRIP_STATUS_LABELS } from '@/utils/trips/tripStatus';
import { formatDayRange } from '@/utils/functions/dates';
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';

// The trip's title, map, status, dates, who's going and notes, with editing for editors
// and the share/delete actions. Every change hands back the whole trip.
function TripHeader({ trip, canEdit, linkToMap = true, onChanged, onShare, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [savingTravellers, setSavingTravellers] = useState(false);

  const changeTravellers = async (travellerIds) => {
    setSavingTravellers(true);
    setError(null);
    try {
      const { trip: updated } = await putTripTravellers(trip.id, travellerIds);
      onChanged(updated);
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
    } finally {
      setSavingTravellers(false);
    }
  };

  if (editing) {
    return (
      <section className='grid gap-3' aria-label='Edit trip'>
        <h1 className='text-2xl font-semibold'>Edit trip</h1>
        <TripForm
          initial={trip}
          showTravellers={false}
          submitLabel='Save trip'
          onCancel={() => setEditing(false)}
          onSubmit={async (body) => {
            const { trip: updated } = await updateTrip(trip.id, body);
            onChanged(updated);
            setEditing(false);
          }}
        />
      </section>
    );
  }

  return (
    <section className='grid gap-3'>
      <div className='grid gap-1'>
        {linkToMap && trip.mapName ? (
          <Link to={mapPath(trip.mapId)} className='justify-self-start text-sm text-colour6 underline underline-offset-2'>
            {trip.mapName}
          </Link>
        ) : null}
        <h1 className='text-3xl font-semibold'>{trip.title}</h1>
        <p className='text-sm opacity-80'>
          {[TRIP_STATUS_LABELS[trip.status], formatDayRange(trip.startDate, trip.endDate), trip.role !== 'OWNER' ? `You’re ${ROLE_LABELS[trip.role]?.toLowerCase()}` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      {trip.description ? <p className='max-w-prose whitespace-pre-line'>{trip.description}</p> : null}
      <TripTravellerChips
        travellers={trip.travellers}
        selectedIds={trip.travellerIds || []}
        onChange={canEdit ? changeTravellers : undefined}
        disabled={savingTravellers}
      />
      <InlineAlert>{error}</InlineAlert>
      {canEdit || onShare ? (
        <div className='grid grid-row-wrap gap-2'>
          {canEdit ? (
            <Button quiet onClick={() => setEditing(true)}>
              Edit trip
            </Button>
          ) : null}
          {onShare ? (
            <Button quiet onClick={onShare}>
              Share
            </Button>
          ) : null}
          {canEdit && onDelete ? (
            <Button danger onClick={onDelete}>
              Delete trip
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default TripHeader;
