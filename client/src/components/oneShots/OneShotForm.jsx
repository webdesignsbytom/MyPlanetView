import React, { useId, useMemo, useState } from 'react';
// Hooks
import useSplitUk from '@/hooks/useSplitUk';
// Components
import MomentDateFields from '@/components/moments/MomentDateFields';
import MomentPhotoPicker from '@/components/moments/MomentPhotoPicker';
import PhotoUploader from '@/components/photos/PhotoUploader';
import TripTravellerChips from '@/components/trips/TripTravellerChips';
import FormField from '@/components/ui/FormField';
import TextAreaInput from '@/components/ui/TextAreaInput';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { momentDateBody, momentDateFields } from '@/utils/moments/momentDates';
import { countryName, countryOptionGroupsFor } from '@/utils/map/countries';
import { ONE_SHOT_NOTES_MAX, ONE_SHOT_PHOTOS_MAX } from '@/utils/oneShots/oneShotRules';
import { ONE_SHOT_PHOTO_LEGENDS, ONE_SHOT_WHO_LEGENDS } from '@/utils/oneShots/oneShotWords';

/**
 * Ticking an item of Life's One Shots, or changing its tick (OneShotDialog): when (a day, a
 * month, a year or not known, as a moment's date), where (the places it's usually seen first),
 * who on the map was there, up to 5 photos of you with it (26 Nov 2026, the user's wish: the
 * map's own, never videos; the first on its card, any other put first with a press) and a
 * note. `uploader` (the map page's upload settings, for editors who may add photos; null hides
 * it) uploads new ones here, each chosen as it's saved. `onSave(body)` sends it (the caller
 * says what went wrong by throwing); `onRemove` takes the tick off. `start` fills a new tick
 * in (a flight's day, from a suggestion).
 */
function OneShotForm({ item, tick = null, start = null, travellers = [], photoSource = null, uploader = null, onSave, onRemove = null }) {
  const uid = useId();
  const splitUk = useSplitUk();
  const from = tick || start || {};
  const [form, setForm] = useState(() => ({
    date: momentDateFields({ happenedOn: from.seenOn || '', datePrecision: from.datePrecision || (from.seenOn ? 'DAY' : null) }),
    countryCode: from.countryCode || '',
    travellerIds: tick?.travellerIds || (travellers.length === 1 ? [travellers[0].id] : []),
    photos: (tick?.photos || (tick?.photo ? [tick.photo] : [])).map((photo) => ({ id: photo.id, thumbUrl: photo.thumbUrl })),
    notes: tick?.notes || '',
  }));
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const setPhotos = (photos) => setForm((prev) => ({ ...prev, photos }));

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
        photoIds: form.photos.map((photo) => photo.id),
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
        <div className='grid gap-2' data-one-shot-photos=''>
          <MomentPhotoPicker
            idPrefix={`${uid}-photo`}
            source={photoSource}
            chosen={form.photos}
            onChange={setPhotos}
            max={ONE_SHOT_PHOTOS_MAX}
            photosOnly
            coverLabel='On the card'
            legend={ONE_SHOT_PHOTO_LEGENDS[item.list]}
            fullText={`That’s the most: ${ONE_SHOT_PHOTOS_MAX}. Untick one to choose another.`}
          />
          {form.photos.length > 1 ? <p className='text-xs opacity-80'>The first is on its card: press another to put it there.</p> : null}
          {uploader ? (
            <>
              <button
                type='button'
                aria-expanded={uploading}
                onClick={() => setUploading((on) => !on)}
                className='justify-self-start text-sm font-medium underline underline-offset-2'
              >
                {uploading ? 'Done uploading' : 'Upload new photos'}
              </button>
              {uploading ? (
                <PhotoUploader
                  {...uploader}
                  defaultCountryCode={form.countryCode}
                  // Each new photo (never a video) joins the tick as it's saved, up to the 5
                  onUploaded={(photo) => {
                    if (photo && photo.kind !== 'VIDEO') {
                      setForm((prev) =>
                        prev.photos.length >= ONE_SHOT_PHOTOS_MAX || prev.photos.some((p) => p.id === photo.id)
                          ? prev
                          : { ...prev, photos: [...prev.photos, { id: photo.id, thumbUrl: photo.thumbUrl }] },
                      );
                    }
                    uploader.onUploaded?.(photo);
                  }}
                />
              ) : null}
            </>
          ) : null}
        </div>
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
