import React, { useEffect, useId, useState } from 'react';
// Api
import { getMyMaps } from '@/api/travelApi';
import { getCopyChoices, previewTravelCopy, requestTravelCopy } from '@/api/travelCopiesApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import CheckboxInput from '@/components/ui/CheckboxInput';
import RadioInput from '@/components/ui/RadioInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import TravelCopyPhotoPicker from './TravelCopyPhotoPicker';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';
import { copyContents, copyPlaceName } from '@/utils/travelCopies/travelCopyWords';

const NOTHING = { tripIds: [], momentIds: [], countryCodes: [], photoIds: [] };
const flip = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const LEGEND = 'font-travel text-base uppercase tracking-wide text-poster-brown';

function Loading({ label }) {
  return (
    <div className='grid place-items-center py-2' role='status'>
      <LoadingSpinner />
      <span className='sr-only'>{label}</span>
    </div>
  );
}

const tripLine = (trip) =>
  [
    trip.startDate ? `${formatDay(trip.startDate)}${trip.endDate && trip.endDate !== trip.startDate ? ` to ${formatDay(trip.endDate)}` : ''}` : null,
    trip.countries.map(countryName).join(', ') || null,
    `${trip.photos} ${trip.photos === 1 ? 'photo' : 'photos'}`,
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * "Bring your travels" (docs/API.md, "Travel copies"): on their own map (`toMap`), someone
 * picks another map they're on (their family's), says which of its travellers they are,
 * ticks the trips they went on, the moments about them, countries' photos and photos one by
 * one, sees what fits on their map, and asks that map's owner. `onRequested(request)` once asked.
 */
function TravelCopyDialog({ toMap, onClose, onRequested }) {
  const uid = useId();
  const [maps, setMaps] = useState(null);
  const [fromMapId, setFromMapId] = useState('');
  const [askedTraveller, setAskedTraveller] = useState(null);
  const [choices, setChoices] = useState(null);
  const [picked, setPicked] = useState(NOTHING);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const travellerId = choices?.travellerId ?? null;
  const total = picked.tripIds.length + picked.momentIds.length + picked.countryCodes.length + picked.photoIds.length;

  // The maps to take from: every map they're on, but this one
  useEffect(() => {
    let alive = true;
    getMyMaps()
      .then(({ maps: list = [] }) => alive && setMaps(list.filter((m) => m.id !== toMap.id)))
      .catch((err) => alive && setError(err.friendlyMessage || 'Your maps couldn’t be loaded.'));
    return () => {
      alive = false;
    };
  }, [toMap.id]);

  // That map's travellers, and what the one chosen (else their own) can take
  useEffect(() => {
    if (!fromMapId) return undefined;
    let alive = true;
    setChoices(null);
    setPicked(NOTHING);
    setError(null);
    getCopyChoices(fromMapId, askedTraveller)
      .then((c) => alive && setChoices(c))
      .catch((err) => alive && setError(err.friendlyMessage || 'That map’s travels couldn’t be loaded.'));
    return () => {
      alive = false;
    };
  }, [fromMapId, askedTraveller]);

  // What the choice comes to on this map, a moment after it changes
  useEffect(() => {
    setPreview(null);
    if (!fromMapId || !travellerId || !total) return undefined;
    let alive = true;
    const timer = setTimeout(() => {
      previewTravelCopy(fromMapId, { toMapId: toMap.id, travellerId, ...picked })
        .then((p) => alive && setPreview(p))
        .catch((err) => alive && setPreview({ error: err.friendlyMessage || 'That choice couldn’t be checked.' }));
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [fromMapId, travellerId, picked, total, toMap.id]);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const { request } = await requestTravelCopy(fromMapId, { toMapId: toMap.id, travellerId, ...picked });
      setSent(request);
      onRequested?.(request);
    } catch (err) {
      setError(err.friendlyMessage || 'The request couldn’t be sent.');
    } finally {
      setSending(false);
    }
  };

  const fromMap = maps?.find((m) => m.id === fromMapId);
  const tight = preview && !preview.error ? preview.countries.filter((c) => c.fits < c.photos) : [];
  const canSend = Boolean(preview && !preview.error && !preview.locked && (preview.fits || preview.trips || preview.moments));

  if (sent) {
    return (
      <Modal title='Bring your travels' onClose={onClose}>
        <div className='grid gap-3'>
          <InlineAlert tone='good'>
            Asked. {fromMap?.ownerName || 'The map’s owner'} has been emailed, and their answer will show in this map’s settings.
            Once they approve, your copies arrive on “{toMap.name}”.
          </InlineAlert>
          <Button onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title='Bring your travels' onClose={onClose} wide>
      <div className='grid gap-5'>
        <p className='text-sm'>
          Pick the trips, moments and photos you’re in on another map, such as your family’s. Once its owner approves, copies of
          your own arrive on “{toMap.name}”, and their map stays as it is. Hidden photos and videos stay behind.
        </p>

        <div className='grid gap-1'>
          <label htmlFor={`${uid}-map`} className={LEGEND}>
            Copy from
          </label>
          {maps === null ? (
            error ? null : <Loading label='Loading your maps…' />
          ) : maps.length ? (
            <PlainOptionSelect
              id={`${uid}-map`}
              value={fromMapId}
              onChange={(e) => {
                setAskedTraveller(null);
                setFromMapId(e.target.value);
              }}
              options={[
                { value: '', label: 'Choose a map', disabled: true },
                ...maps.map((m) => ({ value: m.id, label: m.role !== 'OWNER' && m.ownerName ? `${m.name} (${m.ownerName})` : m.name })),
              ]}
            />
          ) : (
            <p className='text-sm'>You’re not on any other map yet. Ask its owner to share it with you, then come back here.</p>
          )}
        </div>

        {fromMapId && !choices && !error ? <Loading label='Loading its travels…' /> : null}

        {choices ? (
          <fieldset className='grid gap-1.5'>
            <legend className={LEGEND}>Which one are you?</legend>
            {choices.travellers.map((t) => (
              <RadioInput
                key={t.id}
                id={`${uid}-traveller-${t.id}`}
                name={`${uid}-traveller`}
                value={t.id}
                checked={travellerId === t.id}
                disabled={t.taken}
                onChange={() => setAskedTraveller(t.id)}
                label={t.taken ? `${t.name} (someone else’s account)` : t.name}
              />
            ))}
          </fieldset>
        ) : null}

        {choices && travellerId ? (
          <>
            <fieldset className='grid gap-1.5'>
              <legend className={LEGEND}>Trips you went on</legend>
              {choices.trips.length ? (
                choices.trips.map((trip) => (
                  <CheckboxInput
                    key={trip.id}
                    id={`${uid}-trip-${trip.id}`}
                    checked={picked.tripIds.includes(trip.id)}
                    onChange={() => setPicked((p) => ({ ...p, tripIds: flip(p.tripIds, trip.id) }))}
                    label={
                      <span className='grid'>
                        <span className='font-medium'>{trip.title}</span>
                        <span className='text-xs opacity-80'>{tripLine(trip)}</span>
                      </span>
                    }
                  />
                ))
              ) : (
                <p className='text-sm opacity-80'>No trips list you as a traveller.</p>
              )}
            </fieldset>

            {choices.moments.length ? (
              <fieldset className='grid gap-1.5'>
                <legend className={LEGEND}>Moments about you</legend>
                {choices.moments.map((m) => (
                  <CheckboxInput
                    key={m.id}
                    id={`${uid}-moment-${m.id}`}
                    checked={picked.momentIds.includes(m.id)}
                    onChange={() => setPicked((p) => ({ ...p, momentIds: flip(p.momentIds, m.id) }))}
                    label={
                      <span className='grid'>
                        <span className='font-medium'>{m.title}</span>
                        <span className='text-xs opacity-80'>
                          {[countryName(m.countryCode), m.photoIds.length ? `${m.photoIds.length} ${m.photoIds.length === 1 ? 'photo' : 'photos'}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                    }
                  />
                ))}
              </fieldset>
            ) : null}

            {choices.countries.length ? (
              <fieldset className='grid gap-1.5'>
                <legend className={LEGEND}>Every photo in a country</legend>
                <div className='grid gap-1.5 sm:grid-cols-2'>
                  {choices.countries.map((c) => (
                    <CheckboxInput
                      key={c.countryCode}
                      id={`${uid}-country-${c.countryCode}`}
                      checked={picked.countryCodes.includes(c.countryCode)}
                      onChange={() => setPicked((p) => ({ ...p, countryCodes: flip(p.countryCodes, c.countryCode) }))}
                      label={`${countryName(c.countryCode)} (${c.photos})`}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}

            <TravelCopyPhotoPicker
              mapId={fromMapId}
              chosenIds={picked.photoIds}
              onChange={(photoIds) => setPicked((p) => ({ ...p, photoIds }))}
            />

            <section className='grid gap-1 border-t-2 border-dashed border-poster-brown/50 pt-3 text-sm' aria-live='polite' aria-label='What comes across'>
              {!total ? (
                <p className='opacity-80'>Tick something to bring.</p>
              ) : !preview ? (
                <Loading label='Working out what fits…' />
              ) : preview.error ? null : (
                <>
                  <p className='font-medium'>
                    Comes to {copyContents({ photos: preview.photos, trips: preview.trips, moments: preview.moments })}.
                  </p>
                  {preview.alreadyCopied ? (
                    <p>
                      {preview.alreadyCopied} of these {preview.alreadyCopied === 1 ? 'photo is' : 'photos are'} already on your map, and won’t be
                      copied again.
                    </p>
                  ) : null}
                  {tight.map((c) => (
                    <p key={c.countryCode ?? 'none'}>
                      {copyPlaceName(c.countryCode)}: {c.fits} of {c.photos} photos fit within your plan’s photos per country. Untick some, or
                      upgrade for more room.
                    </p>
                  ))}
                  {preview.locked ? <p>“{toMap.name}” isn’t paid for, so it can’t take new photos.</p> : null}
                </>
              )}
            </section>
          </>
        ) : null}

        <InlineAlert>{error || preview?.error}</InlineAlert>
        {choices && travellerId ? (
          <Button onClick={send} busy={sending} disabled={!canSend}>
            Ask for a copy
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}

export default TravelCopyDialog;
