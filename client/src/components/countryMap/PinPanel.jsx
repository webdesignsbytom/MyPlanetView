import React, { useCallback, useEffect, useId, useState } from 'react';
// Api
import { addPinVisit, createPin, deletePin, deletePinVisit, getPin, updatePin, updatePinVisit } from '@/api/travelApi';
// Components
import MapPanel from '@/components/map/MapPanel';
import MapActionButton from '@/components/map/MapActionButton';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import CheckboxInput from '@/components/ui/CheckboxInput';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PinVisitForm from './PinVisitForm';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatMomentDate } from '@/utils/moments/momentDates';

const NAME_MAX = 80;
const NOTES_MAX = 2000;

// A pin's name and notes, and whether everyone the map is shared with sees it: a pin is an
// exact spot, so it's the map's editors' own until shared, off to start with, as a moment's
// spot (19 Nov 2026, the user's decision); `initial`: a new pin's so far
function PinDetailsForm({ pin = null, initial = null, onSave, onCancel, saveLabel, children }) {
  const uid = useId();
  const [name, setName] = useState((pin ?? initial)?.name ?? '');
  const [notes, setNotes] = useState((pin ?? initial)?.notes ?? '');
  const [shared, setShared] = useState(pin ? !pin.hidden : Boolean(initial?.hidden === false));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give the pin a name, like "Our spot in Crete".');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), notes: notes.trim() || null, hidden: !shared });
    } catch (err) {
      setError(err.friendlyMessage || 'That pin could not be saved.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-4' noValidate>
      <FormField id={`${uid}-name`} label='Name' required align='start'>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} placeholder='Our spot in Crete' required />
      </FormField>
      <FormField id={`${uid}-notes`} label='Notes' align='start'>
        <TextAreaInput value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={NOTES_MAX} />
      </FormField>
      <CheckboxInput
        id={`${uid}-shared`}
        checked={shared}
        onChange={(e) => setShared(e.target.checked)}
        label='Show this pin to everyone the map is shared with'
      />
      {children}
      {error ? (
        <p role='alert' className='rounded-lg border px-3 py-2 text-sm tone-danger'>
          {error}
        </p>
      ) : null}
      <div className='grid gap-2 sm:grid-cols-2'>
        <MapActionButton type='submit' busy={saving}>
          {saveLabel}
        </MapActionButton>
        {onCancel ? (
          <MapActionButton quiet onClick={onCancel}>
            Cancel
          </MapActionButton>
        ) : null}
      </div>
    </form>
  );
}

// One visit: its date as a stamp, its note and photos, and (editors) its changes
function PinVisit({ visit, index, total, canEdit, editing, onEdit, onDelete, onOpenPhoto }) {
  const [confirming, setConfirming] = useState(false);
  const when = visit.visitedOn ? formatMomentDate({ happenedOn: visit.visitedOn, datePrecision: visit.datePrecision }) : 'Date not known';
  return (
    <article className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-3' aria-label={`Visit ${total - index} of ${total}: ${when}`} data-pin-visit={visit.id}>
      <header className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'>
        <h4 className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>{when}</h4>
        <span className='-rotate-3 border-2 border-double border-poster-brown px-1.5 font-travel text-xs uppercase text-poster-brown'>
          Visit {total - index}
        </span>
      </header>
      {visit.notes ? <p className='whitespace-pre-line text-sm'>{visit.notes}</p> : null}
      {visit.photos.length ? (
        <ul className='grid grid-cols-3 gap-1.5 sm:grid-cols-4' aria-label={`Photos from ${when}`}>
          {visit.photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type='button'
                onClick={() => onOpenPhoto?.(photo, { photos: visit.photos })}
                className='grid aspect-square w-full overflow-hidden border-4 border-poster-cream bg-poster-cream shadow-paper'
              >
                {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' className='h-full w-full object-cover' /> : null}
                <span className='sr-only'>
                  Photo {i + 1} of {visit.photos.length} from {when}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-sm opacity-80'>No photos from this visit yet.</p>
      )}
      {canEdit && !editing ? (
        <div className='grid grid-flow-col justify-start gap-4 text-sm'>
          <button type='button' onClick={onEdit} className='font-medium underline underline-offset-2'>
            Change this visit
          </button>
          {confirming ? (
            <>
              <button type='button' onClick={onDelete} className='font-medium text-poster-red-deep underline underline-offset-2'>
                Delete it for good
              </button>
              <button type='button' onClick={() => setConfirming(false)} className='underline underline-offset-2'>
                Keep it
              </button>
            </>
          ) : (
            <button type='button' onClick={() => setConfirming(true)} className='underline underline-offset-2'>
              Delete this visit
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}

/**
 * A pin on a country's own map (docs/API.md "Country maps"): a place someone keeps going back
 * to, with a visit for every time, newest first, each with its date, note and photos (a photo
 * opens in the viewer with the visit's others). Editors add, change and delete visits and
 * the pin; viewers read it (never a hidden one: the server says it isn't there).
 * `pinId` opens one; `draft` ({ latitude, longitude, countryCode }) makes a new one there,
 * with its first visit, then `onCreated(pin)`. `onChanged` after any change (the map's pins
 * reload); `uploader`: the upload settings for a visit's new photos (MapExperience).
 */
function PinPanel({ pinId = null, draft = null, source, mapId, canEdit = false, locked = false, uploader = null, onOpenPhoto, onCreated, onChanged, onDeleted, onClose }) {
  const [pin, setPin] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null); // null | 'details' | 'newVisit' | visit id
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const editor = canEdit && !locked;

  useEffect(() => {
    if (!pinId) return undefined;
    let live = true;
    setError(null);
    getPin(source, pinId)
      .then(({ pin: loaded }) => live && setPin(loaded))
      .catch((err) => live && setError(err.friendlyMessage || 'This pin could not be loaded.'));
    return () => {
      live = false;
    };
  }, [pinId, source]);

  // Every change answers with the pin as it now is
  const apply = useCallback(
    async (request) => {
      setSaving(true);
      try {
        const { pin: next } = await request;
        setPin(next);
        setMode(null);
        onChanged?.();
      } finally {
        setSaving(false);
      }
    },
    [onChanged],
  );

  // A new pin: where it is, its name and notes, and its first visit
  if (draft) {
    const where = countryName(draft.countryCode);
    return (
      <MapPanel title={`New pin in ${where}`} onClose={onClose}>
        {locked ? <VerifyFirstNote action='add pins' /> : null}
        <NewPin draft={draft} mapId={mapId} source={source} uploader={uploader} onCreated={onCreated} />
      </MapPanel>
    );
  }

  const title = pin?.name ?? 'Pin';
  const visits = pin?.visits ?? [];
  return (
    <MapPanel title={title} onClose={onClose}>
      {!pin ? (
        <div className='grid place-items-center py-6' role='status'>
          {error ? <p className='text-sm'>{error}</p> : <LoadingSpinner />}
          {error ? null : <span className='sr-only'>Loading the pin…</span>}
        </div>
      ) : (
        <div className='grid gap-4' data-pin-panel={pin.id}>
          <p className='font-travel text-sm uppercase tracking-wide text-poster-brown'>
            {countryName(pin.countryCode)} · {visits.length === 1 ? '1 visit' : `${visits.length} visits`}
            {/* `hidden` comes to the map's editors only */}
            {pin.hidden === undefined ? '' : pin.hidden ? ' · only the map’s editors see it' : ' · shared'}
          </p>
          {mode === 'details' ? (
            <PinDetailsForm pin={pin} saveLabel='Save the pin' onCancel={() => setMode(null)} onSave={(body) => apply(updatePin(pin.id, body))} />
          ) : (
            <>
              {pin.notes ? <p className='whitespace-pre-line text-sm'>{pin.notes}</p> : null}
              {editor ? (
                <div className='grid grid-flow-col justify-start gap-4 text-sm'>
                  <button type='button' onClick={() => setMode('details')} className='font-medium underline underline-offset-2'>
                    Change the pin
                  </button>
                  {confirmingDelete ? (
                    <>
                      <button
                        type='button'
                        onClick={async () => {
                          await deletePin(pin.id);
                          onDeleted?.();
                        }}
                        className='font-medium text-poster-red-deep underline underline-offset-2'
                      >
                        Delete the pin and its visits
                      </button>
                      <button type='button' onClick={() => setConfirmingDelete(false)} className='underline underline-offset-2'>
                        Keep it
                      </button>
                    </>
                  ) : (
                    <button type='button' onClick={() => setConfirmingDelete(true)} className='underline underline-offset-2'>
                      Delete the pin
                    </button>
                  )}
                </div>
              ) : null}
            </>
          )}
          {locked ? <VerifyFirstNote action='change pins' /> : null}

          <section className='grid gap-3' aria-label='Visits'>
            <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'>
              <h3 className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>Visits</h3>
              {editor && mode !== 'newVisit' ? (
                <MapActionButton quiet onClick={() => setMode('newVisit')}>
                  Add a visit
                </MapActionButton>
              ) : null}
            </div>
            {mode === 'newVisit' ? (
              <PinVisitForm
                countryCode={pin.countryCode}
                photoSource={source}
                uploader={uploader}
                submitting={saving}
                saveLabel='Add the visit'
                onCancel={() => setMode(null)}
                onSave={(body) => apply(addPinVisit(pin.id, body))}
              />
            ) : null}
            {visits.length ? (
              visits.map((visit, index) =>
                mode === visit.id ? (
                  <PinVisitForm
                    key={visit.id}
                    visit={visit}
                    countryCode={pin.countryCode}
                    photoSource={source}
                    uploader={uploader}
                    submitting={saving}
                    onCancel={() => setMode(null)}
                    onSave={(body) => apply(updatePinVisit(pin.id, visit.id, body))}
                  />
                ) : (
                  <PinVisit
                    key={visit.id}
                    visit={visit}
                    index={index}
                    total={visits.length}
                    canEdit={editor}
                    editing={mode === visit.id}
                    onEdit={() => setMode(visit.id)}
                    onDelete={() => apply(deletePinVisit(pin.id, visit.id))}
                    onOpenPhoto={onOpenPhoto}
                  />
                ),
              )
            ) : (
              <p className='text-sm opacity-80'>No visits yet.{editor ? ' Add one for every time you go.' : ''}</p>
            )}
          </section>
        </div>
      )}
    </MapPanel>
  );
}

// The new pin's form: its details, then its first visit, saved together
function NewPin({ draft, mapId, source, uploader, onCreated }) {
  const [details, setDetails] = useState(null);
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  if (editing) {
    return (
      <PinDetailsForm
        initial={details}
        saveLabel='Next: the first visit'
        onSave={async (body) => {
          setDetails(body);
          setEditing(false);
        }}
      >
        <p className='text-sm'>Next, when you went and your photos from there. Go back as often as you like: each time is a visit of its own.</p>
      </PinDetailsForm>
    );
  }
  return (
    <div className='grid gap-3'>
      <p className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>{details.name}: the first visit</p>
      <PinVisitForm
        countryCode={draft.countryCode}
        photoSource={source}
        uploader={uploader}
        submitting={saving}
        saveLabel='Save the pin'
        onCancel={() => setEditing(true)}
        onSave={async (visit) => {
          setSaving(true);
          try {
            const { pin } = await createPin(mapId, { ...details, latitude: draft.latitude, longitude: draft.longitude, countryCode: draft.countryCode, visit });
            onCreated?.(pin);
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

export default PinPanel;
