import React, { useState } from 'react';
// Icons
import { FiArrowDown, FiArrowUp } from 'react-icons/fi';
// Components
import TripStopForm from './TripStopForm';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDayRange } from '@/utils/functions/dates';

// One stop in the list. Editors move it up or down (buttons, not dragging, so it works
// on any device and from the keyboard), edit it in place, or remove it.
function TripStopItem({ stop, index, count, canEdit, busy, onMove, onSave, onRemove }) {
  const [editing, setEditing] = useState(false);
  const where = [stop.landmarkName, stop.placeName].filter(Boolean).join(', ');
  const name = countryName(stop.countryCode);

  return (
    <li className='grid gap-2 rounded-xl border border-colour5/30 px-4 py-3'>
      <div className='grid grid-cols-a1a items-start gap-3'>
        <span className='grid h-8 w-8 place-items-center rounded-full bg-colour6 font-semibold text-colour1' aria-hidden='true'>
          {index + 1}
        </span>
        <div className='grid gap-0.5'>
          <p className='font-semibold'>
            <span className='sr-only'>Stop {index + 1}: </span>
            {name}
            {where ? <span className='font-normal'> — {where}</span> : null}
          </p>
          {stop.arriveOn || stop.leaveOn ? <p className='text-sm opacity-80'>{formatDayRange(stop.arriveOn, stop.leaveOn)}</p> : null}
          {stop.notes ? <p className='text-sm'>{stop.notes}</p> : null}
        </div>
        {canEdit ? (
          <div className='grid grid-row gap-1'>
            <button
              type='button'
              onClick={() => onMove(-1)}
              disabled={busy || index === 0}
              aria-label={`Move ${name} up`}
              className='grid h-8 w-8 place-items-center rounded-full border border-colour5/40 disabled:opacity-30'
            >
              <FiArrowUp aria-hidden='true' />
            </button>
            <button
              type='button'
              onClick={() => onMove(1)}
              disabled={busy || index === count - 1}
              aria-label={`Move ${name} down`}
              className='grid h-8 w-8 place-items-center rounded-full border border-colour5/40 disabled:opacity-30'
            >
              <FiArrowDown aria-hidden='true' />
            </button>
          </div>
        ) : null}
      </div>

      {canEdit && !editing ? (
        <div className='grid grid-row justify-end gap-3 text-sm'>
          <button type='button' onClick={() => setEditing(true)} className='underline underline-offset-2'>
            Edit
          </button>
          <button type='button' onClick={onRemove} disabled={busy} className='text-status-critical underline underline-offset-2'>
            Remove
          </button>
        </div>
      ) : null}

      {editing ? (
        <TripStopForm
          idPrefix={`stop-${stop.id}`}
          initial={stop}
          submitLabel='Save stop'
          onCancel={() => setEditing(false)}
          onSubmit={async (body) => {
            await onSave(body);
            setEditing(false);
          }}
        />
      ) : null}
    </li>
  );
}

export default TripStopItem;
