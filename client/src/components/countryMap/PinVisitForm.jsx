import React, { useId, useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextAreaInput from '@/components/ui/TextAreaInput';
import MomentDateFields from '@/components/moments/MomentDateFields';
import MomentPhotoPicker from '@/components/moments/MomentPhotoPicker';
import PhotoUploader from '@/components/photos/PhotoUploader';
import MapActionButton from '@/components/map/MapActionButton';
// Utils
import { momentDateBody, momentDateFields } from '@/utils/moments/momentDates';

export const VISIT_PHOTOS_MAX = 50;
const NOTES_MAX = 2000;

/**
 * One time at a pin (docs/API.md "Country maps"): when (a day, a month, a year or not known,
 * as a moment's date), a note, and its photos: chosen from the map's (the country's first,
 * or anywhere on it), or uploaded here, each new one chosen as it's saved (`uploader`: the
 * map page's upload settings, for editors who may add photos; null hides it). `visit` is the
 * one being changed, or null for a new one. `onSave(body)` gets
 * `{ visitedOn, datePrecision, notes, photoIds }` and may throw (its friendlyMessage shows).
 */
function PinVisitForm({ visit = null, countryCode, photoSource, uploader = null, onSave, onCancel, saveLabel = 'Save the visit', submitting = false }) {
  const uid = useId();
  const [date, setDate] = useState(() => momentDateFields(visit ? { happenedOn: visit.visitedOn, datePrecision: visit.datePrecision } : null));
  const [notes, setNotes] = useState(visit?.notes ?? '');
  const [photos, setPhotos] = useState(() => visit?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const when = momentDateBody(date);
    if (when.error) {
      setError(when.error);
      return;
    }
    setError(null);
    try {
      await onSave({ visitedOn: when.happenedOn, datePrecision: when.datePrecision, notes: notes.trim() || null, photoIds: photos.map((p) => p.id) });
    } catch (err) {
      setError(err.friendlyMessage || 'That visit could not be saved.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-4' noValidate data-pin-visit-form=''>
      <MomentDateFields idPrefix={`${uid}-date`} value={date} onChange={setDate} />
      <FormField id={`${uid}-notes`} label='Notes' align='start'>
        <TextAreaInput value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={NOTES_MAX} />
      </FormField>
      <MomentPhotoPicker
        idPrefix={`${uid}-photos`}
        source={{ ...photoSource, country: countryCode }}
        wholeMap={photoSource}
        chosen={photos}
        onChange={setPhotos}
        max={VISIT_PHOTOS_MAX}
        fullText='That’s the most a visit can have. Untick one to choose another.'
      />
      {uploader ? (
        <div className='grid gap-2'>
          <button
            type='button'
            aria-expanded={uploading}
            onClick={() => setUploading((on) => !on)}
            className='justify-self-start text-sm font-medium underline underline-offset-2'
          >
            {uploading ? 'Done uploading' : 'Upload new photos for this visit'}
          </button>
          {uploading ? (
            <PhotoUploader
              {...uploader}
              defaultCountryCode={countryCode}
              // Each new photo joins the visit as it's saved
              onUploaded={(photo) => {
                setPhotos((prev) => (prev.length >= VISIT_PHOTOS_MAX || prev.some((p) => p.id === photo.id) ? prev : [...prev, { id: photo.id, thumbUrl: photo.thumbUrl }]));
                uploader.onUploaded?.(photo);
              }}
            />
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p role='alert' className='rounded-lg border px-3 py-2 text-sm tone-danger'>
          {error}
        </p>
      ) : null}
      <div className='grid gap-2 sm:grid-cols-2'>
        <MapActionButton type='submit' busy={submitting}>
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

export default PinVisitForm;
