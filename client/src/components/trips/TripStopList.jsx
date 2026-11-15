import React, { useCallback, useEffect, useRef, useState } from 'react';
// Icons
import { FiPlus } from 'react-icons/fi';
// Api
import { createStop, deleteStop, reorderStops, updateStop } from '@/api/travelApi';
// Components
import TripStopItem from './TripStopItem';
import TripStopForm from './TripStopForm';
import TripStopFormCard from './TripStopFormCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import PaperCard from '@/components/common/PaperCard';

// The trip's stops in order, as ticket stubs on a paper card, with adding, editing,
// removing and reordering for editors. "Add a stop" opens its form on its own card (open
// from the start when there are no stops). Every change hands back the whole trip.
function TripStopList({ trip, canEdit, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const stops = trip.stops || [];
  const [adding, setAdding] = useState(stops.length === 0);
  const [focusForm, setFocusForm] = useState(false);
  // Closing the form hands focus back to the button that opened it
  const addButtonRef = useRef(null);
  const refocusAddRef = useRef(false);
  useEffect(() => {
    if (!adding && refocusAddRef.current) {
      refocusAddRef.current = false;
      addButtonRef.current?.focus();
    }
  }, [adding]);

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const { trip: updated } = await action();
      if (updated) onChanged(updated);
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
      throw err;
    } finally {
      setBusy(false);
    }
  };

  // Rejects when the move fails (the stop then keeps focus where it is)
  const move = (index, direction) => {
    const target = index + direction;
    if (busy || target < 0 || target >= stops.length) return Promise.resolve();
    const ids = stops.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    return run(() => reorderStops(trip.id, ids));
  };

  // After a stop is removed, focus goes to the next one's Edit button (the previous one
  // at the end of the list), or to "Add a stop" when none are left
  const [focusStopId, setFocusStopId] = useState(null);
  const clearFocusStop = useCallback(() => setFocusStopId(null), []);
  const remove = (index, stopId) => {
    if (busy) return;
    run(() => deleteStop(trip.id, stopId))
      .then(() => {
        const rest = stops.filter((s) => s.id !== stopId);
        const next = rest[Math.min(index, rest.length - 1)];
        if (next) setFocusStopId(next.id);
        else addButtonRef.current?.focus();
      })
      .catch(() => {});
  };

  const openAdding = () => {
    setFocusForm(true);
    setAdding(true);
  };
  const closeAdding = () => {
    refocusAddRef.current = true;
    setAdding(false);
  };

  return (
    <PaperCard title='Stops' titleId='trip-stops-heading' bodyClassName='gap-3'>
      {stops.length ? (
        <ol className='grid gap-3'>
          {stops.map((stop, index) => (
            <TripStopItem
              key={stop.id}
              stop={stop}
              index={index}
              count={stops.length}
              canEdit={canEdit}
              busy={busy}
              onMove={(direction) => move(index, direction)}
              onSave={(body) => run(() => updateStop(trip.id, stop.id, body))}
              onRemove={() => remove(index, stop.id)}
              focusEdit={focusStopId === stop.id}
              onFocused={clearFocusStop}
            />
          ))}
        </ol>
      ) : (
        <p className='text-sm opacity-80'>No stops yet.</p>
      )}
      <InlineAlert>{error}</InlineAlert>
      {canEdit ? (
        adding ? (
          <TripStopFormCard title='Add a stop' closeLabel='Close the new stop form' onClose={closeAdding} autoFocus={focusForm}>
            <TripStopForm idPrefix='new-stop' onSubmit={(body) => run(() => createStop(trip.id, body))} />
          </TripStopFormCard>
        ) : (
          <div className='grid justify-items-start pt-1'>
            <Button ref={addButtonRef} onClick={openAdding}>
              <FiPlus aria-hidden='true' />
              Add a stop
            </Button>
          </div>
        )
      ) : null}
    </PaperCard>
  );
}

export default TripStopList;
