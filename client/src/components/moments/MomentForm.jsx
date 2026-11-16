import React, { useId, useState } from 'react';
// Api
import { createMoment, updateMoment } from '@/api/travelApi';
// Hooks
import useSplitUk from '@/hooks/useSplitUk';
import useLandmarks from '@/hooks/useLandmarks';
// Components
import MomentDateFields from './MomentDateFields';
import MomentPhotoPicker from './MomentPhotoPicker';
import TripTravellerChips from '@/components/trips/TripTravellerChips';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import CheckboxInput from '@/components/ui/CheckboxInput';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import {
  MOMENT_KIND_OPTIONS,
  MOMENT_PLACE_MAX,
  MOMENT_TEXT_MAX,
  MOMENT_TITLE_MAX,
  statusForKind,
} from '@/utils/moments/momentKinds';
import { momentDateBody, momentDateFields } from '@/utils/moments/momentDates';
import { countryName, countryOptionGroupsFor } from '@/utils/map/countries';
import { VISIT_STATUS_LABELS } from '@/utils/map/visitStatus';
import { isPole } from '@/utils/map/specialPlaces';
import { serverText } from '@/utils/regex/regex';

/**
 * A moment, new or (`moment`) being changed: its kind, title and story, when, where (a
 * landmark in its country, or a place name), the trip, who it's about, its photos and
 * whether viewers see it. Saved here; `onSaved(moment)` gets the server's answer.
 *
 * - `countryCode`: the moment's country, fixed (a country's panel); without it the form
 *   asks, starting at `defaultCountryCode` (a trip's page).
 * - `tripId`: the trip, fixed (a trip's page); else `trips` (the map's own) to choose from.
 * - `photoSource` lists the photos to choose from; `wholeMap` (a map editor's) adds the
 *   whole map's.
 * - A new moment in a country with no status (`visitStatus` null) offers to mark it with
 *   `onMarkVisit(status)`: Lived for a birth or a move, else Visited.
 * - A new birth offers to add the baby as a traveller born there (`onAddTraveller`).
 */
function MomentForm({
  moment = null,
  mapId,
  countryCode = null,
  defaultCountryCode = '',
  tripId,
  trips = null,
  travellers = [],
  photoSource,
  wholeMap = null,
  visitStatus,
  onMarkVisit,
  onAddTraveller,
  onSaved,
  onCancel,
}) {
  const uid = useId();
  const [form, setForm] = useState(() => ({
    kind: moment?.kind || 'SAW_OR_DID',
    title: moment?.title || '',
    text: moment?.text || '',
    date: momentDateFields(moment),
    countryCode: countryCode || moment?.countryCode || defaultCountryCode || '',
    landmarkId: moment?.landmark?.id || '',
    placeName: moment?.placeName || '',
    tripId: moment ? moment.tripId || '' : tripId || '',
    travellerIds: moment?.travellerIds || [],
    photos: moment?.photos || [],
    hidden: Boolean(moment?.hidden),
    markVisit: true,
    addBaby: false,
    babyName: '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // The map's places: the UK's nations instead of it on a map that splits it
  const splitUk = useSplitUk();
  const country = countryCode || form.countryCode;
  const { landmarks } = useLandmarks(country, { enabled: Boolean(country) });

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value, ...(key === 'countryCode' ? { landmarkId: '' } : {}) }));
  };

  const isNew = !moment;
  const offerVisit = isNew && !visitStatus && Boolean(onMarkVisit) && Boolean(country);
  const offerBaby = isNew && form.kind === 'BORN' && Boolean(onAddTraveller) && Boolean(country) && !isPole(country);
  const placeName = country ? countryName(country) : 'this country';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!serverText(form.title)) return setError('Give the moment a title.');
    if (!country) return setError('Choose the country it happened in.');
    const date = momentDateBody(form.date);
    if (date.error) return setError(date.error);
    const babyName = serverText(form.babyName);
    if (offerBaby && form.addBaby && !babyName) return setError('Give the baby’s name, to add them to the map.');

    setSaving(true);
    try {
      const travellerIds = [...form.travellerIds];
      if (offerBaby && form.addBaby) {
        const traveller = await onAddTraveller({ name: babyName, birthCountryCode: country });
        if (traveller?.id) travellerIds.push(traveller.id);
      }
      const body = {
        kind: form.kind,
        title: form.title,
        text: form.text.trim() || null,
        ...date,
        countryCode: country,
        landmarkId: form.landmarkId || null,
        placeName: form.placeName.trim() || null,
        hidden: form.hidden,
        travellerIds,
        photoIds: form.photos.map((p) => p.id),
        // A trip that's fixed is only sent when the moment is new (moving one needs the map)
        ...(trips ? { tripId: form.tripId || null } : isNew && tripId ? { tripId } : {}),
      };
      const { moment: saved } = isNew ? await createMoment(mapId, body) : await updateMoment(moment.id, body);
      // A new moment in a country with no status: mark it, as offered (the panel shows a failure)
      if (offerVisit && form.markVisit) onMarkVisit(statusForKind(form.kind));
      onSaved(saved);
    } catch (err) {
      setError(err.friendlyMessage || 'The moment could not be saved.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-3' noValidate>
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${uid}-kind`} label='What kind'>
          <PlainOptionSelect value={form.kind} onChange={set('kind')} options={MOMENT_KIND_OPTIONS} />
        </FormField>
        <FormField id={`${uid}-title`} label='Title' required>
          <TextInput value={form.title} onChange={set('title')} maxLength={MOMENT_TITLE_MAX} required />
        </FormField>
      </div>
      <FormField id={`${uid}-text`} label='The story'>
        <TextAreaInput value={form.text} onChange={set('text')} rows={3} maxLength={MOMENT_TEXT_MAX} />
      </FormField>

      <MomentDateFields idPrefix={`${uid}-date`} value={form.date} onChange={(date) => setForm((prev) => ({ ...prev, date }))} />

      {countryCode ? null : (
        <FormField id={`${uid}-country`} label='Country' required>
          <GroupedOptionSelect
            value={form.countryCode}
            onChange={set('countryCode')}
            groups={countryOptionGroupsFor(splitUk)}
            placeholder='Choose a country'
            required
          />
        </FormField>
      )}
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${uid}-landmark`} label='Landmark'>
          <PlainOptionSelect
            value={form.landmarkId}
            onChange={set('landmarkId')}
            disabled={!landmarks.length}
            options={[
              { value: '', label: landmarks.length ? 'None' : 'None known' },
              ...landmarks.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
        </FormField>
        <FormField id={`${uid}-place`} label='Town or place'>
          <TextInput value={form.placeName} onChange={set('placeName')} maxLength={MOMENT_PLACE_MAX} />
        </FormField>
      </div>

      {trips ? (
        <FormField id={`${uid}-trip`} label='Trip'>
          <PlainOptionSelect
            value={form.tripId}
            onChange={set('tripId')}
            options={[{ value: '', label: 'Not on a trip' }, ...trips.map((t) => ({ value: t.id, label: t.title }))]}
          />
        </FormField>
      ) : null}

      <TripTravellerChips
        legend='Who it’s about'
        travellers={travellers}
        selectedIds={form.travellerIds}
        onChange={(travellerIds) => setForm((prev) => ({ ...prev, travellerIds }))}
      />

      {offerBaby ? (
        <div className='grid gap-2 border-l-4 border-poster-red pl-3'>
          <CheckboxInput
            id={`${uid}-add-baby`}
            checked={form.addBaby}
            onChange={set('addBaby')}
            label={`Add the baby to this map as a traveller, born in ${placeName}`}
          />
          {form.addBaby ? (
            <FormField id={`${uid}-baby-name`} label='Their name' required>
              <TextInput value={form.babyName} onChange={set('babyName')} maxLength={60} required />
            </FormField>
          ) : null}
        </div>
      ) : null}

      <MomentPhotoPicker
        idPrefix={`${uid}-photos`}
        source={photoSource}
        wholeMap={wholeMap}
        chosen={form.photos}
        onChange={(photos) => setForm((prev) => ({ ...prev, photos }))}
      />

      <CheckboxInput
        id={`${uid}-hidden`}
        checked={form.hidden}
        onChange={set('hidden')}
        label='Hide from viewers (only you and the editors see it)'
      />
      {offerVisit ? (
        <CheckboxInput
          id={`${uid}-mark`}
          checked={form.markVisit}
          onChange={set('markVisit')}
          label={`Mark ${placeName} as ${VISIT_STATUS_LABELS[statusForKind(form.kind)].toLowerCase()} on the map`}
        />
      ) : null}

      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' busy={saving}>
          {isNew ? 'Add moment' : 'Save moment'}
        </Button>
      </div>
    </form>
  );
}

export default MomentForm;
