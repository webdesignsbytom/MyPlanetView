import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FiArrowLeft } from 'react-icons/fi';
// Api
import { putTripTravellers, updateTrip } from '@/api/travelApi';
// Constants
import { mapPath } from '@/utils/constants/routes';
// Components
import TripForm from './TripForm';
import TripTravellerChips from './TripTravellerChips';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import PaperCard from '@/components/common/PaperCard';
import PageTitleCard from '@/components/common/PageTitleCard';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
// Utils
import { TRIP_STATUS_LABELS } from '@/utils/trips/tripStatus';
import { formatDayRange } from '@/utils/functions/dates';

// The action buttons: two to a row, filling it, on a phone; side by side from sm up
const ACTIONS_ROW = 'grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2 sm:grid-row sm:grid-cols-none';

// What someone added to the trip (not its owner) may do, in the title card's summary line
const ROLE_SUMMARY = { EDITOR: 'You can edit', VIEWER: 'You can view' };

// The rubber stamp beside the title, by trip status
const STATUS_STAMPS = {
  PLANNED: ['Trip', 'planned'],
  ACTIVE: ['On the', 'road'],
  COMPLETED: ['Trip', 'done'],
};

// The trip's title card, like a public page's: the title (the page's h1) on aged
// parchment with its status stamp, then a cream body with the way back to its map, the
// notes, who's going and the actions. Editors edit it in the same card, so the h1 stays.
// Every change hands back the whole trip.
// `locked`: an editor whose email address isn't verified yet; the actions say why they're missing.
function TripHeader({ trip, canEdit, locked = false, linkToMap = true, onChanged, onShare, onDelete }) {
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

  const summary = [
    TRIP_STATUS_LABELS[trip.status],
    formatDayRange(trip.startDate, trip.endDate),
    ROLE_SUMMARY[trip.role] || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PaperCard
      aria-labelledby='trip-title'
      className='paper-fields'
      bodyClassName='gap-5'
      header={
        <PageTitleCard embedded page='Trip' title={trip.title} headingId='trip-title' subtitle={summary} stamp={STATUS_STAMPS[trip.status]} />
      }
    >
      {/* Only for people who can open the map: a trip-only member would hit a dead end */}
      {linkToMap && trip.canOpenMap && trip.mapName ? (
        <Link
          to={mapPath(trip.mapId)}
          className='grid grid-row items-center gap-2 justify-self-start font-travel text-base uppercase tracking-wide text-poster-red-deep underline underline-offset-4 hover:no-underline'
        >
          <FiArrowLeft aria-hidden='true' />
          Back to {trip.mapName}
        </Link>
      ) : null}

      {editing ? (
        <section className='grid gap-3' aria-labelledby='trip-edit-heading'>
          <h2 id='trip-edit-heading' className='font-travel text-xl uppercase tracking-wide text-poster-red-deep'>
            Edit trip
          </h2>
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
      ) : (
        <>
          {trip.description ? <p className='max-w-prose whitespace-pre-line'>{trip.description}</p> : null}
          <TripTravellerChips
            travellers={trip.travellers}
            selectedIds={trip.travellerIds || []}
            onChange={canEdit ? changeTravellers : undefined}
            disabled={savingTravellers}
          />
          <InlineAlert>{error}</InlineAlert>
          {locked ? <VerifyFirstNote action='change this trip, its stops, moments or photos' /> : null}
          {canEdit || onShare ? (
            <div className={`${ACTIONS_ROW} border-t-2 border-dashed border-poster-brown/60 pt-5`}>
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
              {/* Only the map's owner and editors may (the server's canDelete); not someone added to the trip alone */}
              {canEdit && trip.canDelete && onDelete ? (
                <Button danger onClick={onDelete}>
                  Delete trip
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </PaperCard>
  );
}

export default TripHeader;
