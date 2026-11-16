import React, { useEffect, useState } from 'react';
// Api
import { addTripToMap, getTrip, removeTripFromMap } from '@/api/travelApi';
// Components
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import PaperCard from '@/components/common/PaperCard';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { forgetMapLists, myMaps } from '@/utils/map/mapListCache';

const canAddTo = (map) => map.role === 'OWNER' || map.role === 'EDITOR';

/**
 * A group trip on your own maps (docs/API.md "Group trips"): which of your maps show it
 * (`trip.onMyMaps`), each with "Take it off" where you may (you added it, or own that
 * map), and "Add to my map", which lists the maps you own or edit. Nothing is copied: the
 * trip and its photos stay here; once it's done, its countries are marked on those maps
 * too. `locked`: an unverified email address (adding and taking off need a verified one).
 */
function TripMyMaps({ trip, userId, locked = false, onTripChange }) {
  const [open, setOpen] = useState(false);
  const [maps, setMaps] = useState(() => myMaps.peek(userId));
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const onMyMaps = trip.onMyMaps || [];

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    myMaps
      .load(userId)
      .then((list) => {
        if (!cancelled) setMaps(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage || 'Your maps could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const showing = new Set(onMyMaps.map((link) => link.mapId));
  const choices = (maps || []).filter((map) => canAddTo(map) && map.id !== trip.mapId);

  const add = async (map) => {
    setBusyId(map.id);
    setError(null);
    setDone(null);
    try {
      const { trip: updated } = await addTripToMap(trip.id, map.id);
      forgetMapLists();
      onTripChange(updated);
      setOpen(false);
      setDone(
        trip.status === 'COMPLETED'
          ? `Added to ${map.name}, with its countries marked there.`
          : `Added to ${map.name}. Its countries are marked there once the trip is done.`,
      );
    } catch (err) {
      setError(err.friendlyMessage || 'The trip could not be added to that map.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (link) => {
    setBusyId(link.mapId);
    setError(null);
    setDone(null);
    try {
      await removeTripFromMap(trip.id, link.mapId);
      forgetMapLists();
      const { trip: updated } = await getTrip(trip.id);
      onTripChange(updated);
      setDone(`Taken off ${link.name}. The countries it marked there stay.`);
    } catch (err) {
      setError(err.friendlyMessage || 'The trip could not be taken off that map.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PaperCard title='On your maps' titleId='trip-my-maps-heading'>
      <p className='max-w-prose text-sm'>
        Add this trip to a map of your own: it shows in that map’s trips, and once it’s done its countries are marked there
        too. The trip and its photos stay here.
      </p>

      {onMyMaps.length ? (
        <ul aria-label='Your maps showing this trip' className='grid gap-2'>
          {onMyMaps.map((link) => (
            <li key={link.mapId} className='grid grid-cols-rev items-center gap-3 border-2 border-dashed border-poster-brown/60 px-3 py-2'>
              <span className='font-travel text-base uppercase tracking-wide'>{link.name}</span>
              {link.canRemove && !locked ? (
                <Button small quiet busy={busyId === link.mapId} onClick={() => remove(link)} ariaLabel={`Take it off ${link.name}`}>
                  Take it off
                </Button>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {locked ? (
        <VerifyFirstNote action='add this trip to your maps' />
      ) : trip.canAddToMyMap ? (
        <div className='grid gap-3'>
          <div className='grid justify-items-start'>
            <Button quiet ariaExpanded={open} onClick={() => setOpen((on) => !on)}>
              Add to my map
            </Button>
          </div>
          {open ? (
            maps ? (
              <ul aria-label='Your maps' className='grid gap-2'>
                {choices.map((map) => (
                  <li key={map.id} className='grid grid-cols-rev items-center gap-3 border-2 border-dashed border-poster-brown/60 px-3 py-2'>
                    <span className='font-travel text-base uppercase tracking-wide'>{map.name}</span>
                    {showing.has(map.id) ? (
                      <span className='text-xs'>Already on it</span>
                    ) : (
                      <Button small busy={busyId === map.id} onClick={() => add(map)} ariaLabel={`Add to ${map.name}`}>
                        Add
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : error ? null : (
              <div className='grid place-items-center py-2' role='status'>
                <LoadingSpinner />
                <span className='sr-only'>Loading your maps…</span>
              </div>
            )
          ) : null}
        </div>
      ) : null}

      <InlineAlert>{error}</InlineAlert>
      <InlineAlert tone='good'>{done}</InlineAlert>
    </PaperCard>
  );
}

export default TripMyMaps;
