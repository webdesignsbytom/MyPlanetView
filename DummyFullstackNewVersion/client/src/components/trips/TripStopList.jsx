import React, { useState } from 'react';
// Api
import { createStop, deleteStop, reorderStops, updateStop } from '@/api/travelApi';
// Components
import TripStopItem from './TripStopItem';
import TripStopForm from './TripStopForm';
import InlineAlert from '@/components/common/InlineAlert';

// The trip's stops in order, with adding, editing, removing and reordering for editors.
// Every change hands back the whole trip (`onChanged`).
function TripStopList({ trip, canEdit, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const stops = trip.stops || [];

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

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= stops.length) return;
    const ids = stops.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => reorderStops(trip.id, ids)).catch(() => {});
  };

  return (
    <section className='grid gap-3' aria-labelledby='trip-stops-heading'>
      <h2 id='trip-stops-heading' className='text-xl font-semibold'>
        Stops
      </h2>
      {stops.length ? (
        <ol className='grid gap-2'>
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
              onRemove={() => run(() => deleteStop(trip.id, stop.id)).catch(() => {})}
            />
          ))}
        </ol>
      ) : (
        <p className='text-sm opacity-80'>No stops yet.</p>
      )}
      <InlineAlert>{error}</InlineAlert>
      {canEdit ? (
        <details className='rounded-xl border border-colour5/30 px-4 py-3' open={!stops.length}>
          <summary className='cursor-pointer font-medium'>Add a stop</summary>
          <div className='pt-3'>
            <TripStopForm idPrefix='new-stop' onSubmit={(body) => run(() => createStop(trip.id, body))} />
          </div>
        </details>
      ) : null}
    </section>
  );
}

export default TripStopList;
