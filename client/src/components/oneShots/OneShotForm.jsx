import React, { useId, useMemo, useState } from 'react';
// Hooks
import useSplitUk from '@/hooks/useSplitUk';
// Components
import MomentDateFields from '@/components/moments/MomentDateFields';
import MomentPhotoPicker from '@/components/moments/MomentPhotoPicker';
import TripTravellerChips from '@/components/trips/TripTravellerChips';
import FormField from '@/components/ui/FormField';
import TextAreaInput from '@/components/ui/TextAreaInput';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { momentDateBody, momentDateFields } from '@/utils/moments/momentDates';
import { countryName, countryOptionGroupsFor } from '@/utils/map/countries';
import { ONE_SHOT_NOTES_MAX } from '@/utils/oneShots/oneShotRules';
import { ONE_SHOT_WHO_LEGENDS } from '@/utils/oneShots/oneShotWords';

/**
 * Ticking an item of Life's One Shots, or changing its tick (OneShotDialog): when (a day, a
 * month, a year or not known, as a moment's date), where (the places it's usually seen first),
 * who on the map was there, one of the map's photos and a note. `onSave(body)` sends it (the
 * caller says what went wrong by throwing); `onRemove` takes the tick off. `start` fills a
 * new tick in (a flight's day, from a suggestion).
 */
function OneShotForm({ item, tick = null, start = null, travellers = [], photoSource = null, onSave, onRemove = null }) {
  const uid = useId();
  const splitUk = useSplitUk();
  const from = tick || start || {};
  const [form, setForm] = useState(() => ({
    date: momentDateFields({ happenedOn: from.seenOn || '', datePrecision: from.datePrecision || (from.seenOn ? 'DAY' : null) }),
    countryCode: from.countryCode || '',
    travellerIds: tick?.travellerIds || (travellers.length === 1 ? [travellers[0].id] : []),
    photos: tick?.photo ? [{ id: tick.photo.id, thumbUrl: tick.photo.thumbUrl }] : [],
    notes: tick?.notes || '',
  }));
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  // Where it's usually seen first, then every place on the map
  const groups = useMemo(() => {
    const all = countryOptionGroupsFor(splitUk);
    const offered = new Set(all.flatMap((group) => group.options.map((option) => option.value)));
    const usual = item.countries.filter((code) => offered.has(code));
    const usualSet = new Set(usual);
    return [
      ...(usual.length ? [{ label: 'Where it’s usually seen', options: usual.map((code) => ({ value: code, label: countryName(code) })) }] : []),
      ...all.map((group) => ({ ...group, options: group.options.filter((option) => !usualSet.has(option.value)) })),
    ];
  }, [item.countries, splitUk]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const date = momentDateBody(form.date);
    if (date.error) {
      setError(date.error);
      return;
    }
    setBusy('save');
    setError('');
    try {
      await onSave({
        seenOn: date.happenedOn,
        datePrecision: date.datePrecision,
        countryCode: form.countryCode || null,
        travellerIds: form.travellerIds,
        photoId: form.photos[0]?.id || null,
        notes: form.notes.trim() || null,
        ...(start?.source && !tick ? { source: start.source } : {}),
      });
    } catch (err) {
      setError(err?.friendlyMessage || 'That couldn’t be saved. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('remove');
    setError('');
    try {
      await onRemove();
    } catch (err) {
      setError(err?.friendlyMessage || 'That couldn’t be taken off. Please try again.');
      setBusy(null);
    }
  };

  return (
    <form className='grid gap-4' onSubmit={save} aria-label={tick ? `Change ${item.name}` : `Tick ${item.name}`} data-one-shot-form=''>
      <MomentDateFields idPrefix={`${uid}-date`} value={form.date} onChange={(date) => setForm((prev) => ({ ...prev, date }))} />
      <FormField id={`${uid}-country`} label='Where' align='start'>
        <GroupedOptionSelect value={form.countryCode} onChange={set('countryCode')} groups={groups} placeholder='Not saying' />
      </FormField>
      <TripTravellerChips
        legend={ONE_SHOT_WHO_LEGENDS[item.list]}
        travellers={travellers}
        selectedIds={form.travellerIds}
        onChange={(travellerIds) => setForm((prev) => ({ ...prev, travellerIds }))}
      />
      {photoSource ? (
        <MomentPhotoPicker
          idPrefix={`${uid}-photo`}
          source={photoSource}
          chosen={form.photos}
          onChange={(photos) => setForm((prev) => ({ ...prev, photos: photos.slice(-1) }))}
          max={1}
          fullText='One photo for each: untick it to choose another.'
        />
      ) : null}
      <FormField id={`${uid}-notes`} label='A note' align='start'>
        <TextAreaInput value={form.notes} onChange={set('notes')} maxLength={ONE_SHOT_NOTES_MAX} rows={2} />
      </FormField>
      <InlineAlert>{error}</InlineAlert>
      <div className='grid gap-2 sm:grid-cols-2'>
        <Button type='submit' busy={busy === 'save'}>
          {tick ? 'Save' : 'Tick it'}
        </Button>
        {tick && onRemove ? (
          <Button quiet busy={busy === 'remove'} onClick={remove}>
            Take it off
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export default OneShotForm;
