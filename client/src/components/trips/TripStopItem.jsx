import React, { useEffect, useRef, useState } from 'react';
// Icons
import { FiArrowDown, FiArrowUp } from 'react-icons/fi';
// Components
import TripStopForm from './TripStopForm';
import TripStopFormCard from './TripStopFormCard';
import Button from '@/components/common/Button';
import MapRoundButton from '@/components/map/MapRoundButton';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDayRange } from '@/utils/functions/dates';

// One stop in the list, as a ticket stub: its number as a red rubber stamp behind a
// dashed perforation, then where and when. Editors move it up or down with round stamps
// (buttons, not dragging, so it works on any device and from the keyboard), and edit it
// on its own form card in place, or remove it.
function TripStopItem({ stop, index, count, canEdit, busy, onMove, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const where = [stop.landmarkName, stop.placeName].filter(Boolean).join(', ');
  const name = countryName(stop.countryCode);
  const label = `stop ${index + 1}, ${name}`;
  // Closing the form hands focus back to its Edit button
  const editButtonRef = useRef(null);
  const refocusEditRef = useRef(false);
  useEffect(() => {
    if (!editing && refocusEditRef.current) {
      refocusEditRef.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);
  const closeEditing = () => {
    refocusEditRef.current = true;
    setEditing(false);
  };

  return (
    <li className='grid gap-3 border-2 border-dashed border-poster-brown/60 bg-paper-cream p-3 sm:p-4'>
      <div className='grid grid-cols-a1a items-start gap-3'>
        <span
          aria-hidden='true'
          className='grid h-full content-start border-r-2 border-dashed border-poster-brown/60 pr-3'
        >
          <span className='grid h-10 w-10 -rotate-6 place-items-center rounded-full border-4 border-double border-poster-red bg-poster-paper font-travel text-lg text-poster-red'>
            {index + 1}
          </span>
        </span>
        <div className='grid min-w-0 gap-0.5'>
          <p className='font-semibold'>
            <span className='sr-only'>Stop {index + 1}: </span>
            <span className='font-travel text-lg uppercase tracking-wide text-poster-red-deep'>{name}</span>
            {where ? <span className='font-normal'> — {where}</span> : null}
          </p>
          {stop.arriveOn || stop.leaveOn ? <p className='text-sm opacity-80'>{formatDayRange(stop.arriveOn, stop.leaveOn)}</p> : null}
          {stop.notes ? <p className='text-sm'>{stop.notes}</p> : null}
        </div>
        {canEdit ? (
          <div className='grid gap-2'>
            <MapRoundButton label={`Move ${name} up`} onClick={() => onMove(-1)} disabled={busy || index === 0}>
              <FiArrowUp aria-hidden='true' />
            </MapRoundButton>
            <MapRoundButton label={`Move ${name} down`} onClick={() => onMove(1)} disabled={busy || index === count - 1}>
              <FiArrowDown aria-hidden='true' />
            </MapRoundButton>
          </div>
        ) : null}
      </div>

      {canEdit && !editing ? (
        <div className='grid grid-row justify-end gap-2'>
          <Button ref={editButtonRef} small quiet ariaLabel={`Edit ${label}`} onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button small danger ariaLabel={`Remove ${label}`} onClick={onRemove} disabled={busy}>
            Remove
          </Button>
        </div>
      ) : null}

      {editing ? (
        <TripStopFormCard title={`Edit stop ${index + 1}`} closeLabel={`Stop editing ${label}`} onClose={closeEditing} autoFocus>
          <TripStopForm
            idPrefix={`stop-${stop.id}`}
            initial={stop}
            submitLabel='Save stop'
            onCancel={closeEditing}
            onSubmit={async (body) => {
              await onSave(body);
              closeEditing();
            }}
          />
        </TripStopFormCard>
      ) : null}
    </li>
  );
}

export default TripStopItem;
