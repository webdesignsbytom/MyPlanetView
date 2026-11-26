import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
// Icons
import { FiArrowDown, FiArrowUp } from 'react-icons/fi';
// Components
import TripStopFormCard from './TripStopFormCard';
import Button from '@/components/common/Button';
import MapRoundButton from '@/components/map/MapRoundButton';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDayRange } from '@/utils/functions/dates';

// The editors' form, loaded when editing starts: share links never download it (19 Nov 2026, the audit)
const TripStopForm = lazy(() => import('./TripStopForm'));

// One stop in the list, as a ticket stub: its number as a red rubber stamp behind a
// dashed perforation, then where and when. Editors move it up or down with round stamps
// (buttons, not dragging, so it works on any device and from the keyboard), and edit it
// on its own form card in place, or remove it.
// Keyboard focus survives the changes: nothing focused is disabled while saving (a click
// then is ignored), a moved stop's stamp keeps focus in its new place (or its other
// stamp, once at an end of the list), and `focusEdit` (after a neighbouring stop is
// removed) puts focus on its Edit button.
function TripStopItem({ stop, index, count, canEdit, busy, onMove, onSave, onRemove, focusEdit = false, onFocused }) {
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

  useEffect(() => {
    if (!focusEdit) return;
    editButtonRef.current?.focus();
    onFocused?.();
  }, [focusEdit, onFocused]);

  // The move stamps (MapRoundButton has no ref, so they're found in their column)
  const movesRef = useRef(null);
  const moveDirectionRef = useRef(0);
  useEffect(() => {
    const direction = moveDirectionRef.current;
    if (!direction) return;
    moveDirectionRef.current = 0;
    const [up, down] = movesRef.current?.querySelectorAll('button') || [];
    const atTop = index === 0;
    const atBottom = index === count - 1;
    const target = direction < 0 ? (atTop ? down : up) : atBottom ? up : down;
    target?.focus();
  }, [index, count]);

  const move = (direction, e) => {
    if (busy) return;
    // From the keyboard (Enter or Space: `detail` 0) focus follows the stop; a click lets
    // go of focus, as every round stamp does
    const fromKeyboard = e.detail === 0;
    if (fromKeyboard) moveDirectionRef.current = direction;
    Promise.resolve(onMove(direction)).catch(() => {
      moveDirectionRef.current = 0;
    });
  };

  return (
    <li className='grid gap-3 border-2 border-dashed border-poster-brown/60 bg-paper-cream p-3 sm:p-4'>
      <div className='grid grid-cols-a1a items-start gap-3'>
        <span
          aria-hidden='true'
          className='grid h-full content-start border-r-2 border-dashed border-poster-brown/60 pr-3'
        >
          <span className='grid h-10 w-10 -rotate-6 place-items-center rounded-full border-4 border-double border-poster-red bg-poster-paper font-travel text-lg text-poster-red-deep'>
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
          <div ref={movesRef} className='grid gap-2'>
            <MapRoundButton label={`Move ${label} up`} onClick={(e) => move(-1, e)} disabled={index === 0}>
              <FiArrowUp aria-hidden='true' />
            </MapRoundButton>
            <MapRoundButton label={`Move ${label} down`} onClick={(e) => move(1, e)} disabled={index === count - 1}>
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
          <Button small danger ariaLabel={`Remove ${label}`} onClick={busy ? undefined : onRemove}>
            Remove
          </Button>
        </div>
      ) : null}

      {editing ? (
        <TripStopFormCard title={`Edit stop ${index + 1}`} closeLabel={`Stop editing ${label}`} onClose={closeEditing} autoFocus>
          <Suspense fallback={null}>
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
          </Suspense>
        </TripStopFormCard>
      ) : null}
    </li>
  );
}

export default TripStopItem;
