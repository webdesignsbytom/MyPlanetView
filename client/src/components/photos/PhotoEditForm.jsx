import React, { useState } from 'react';
// Api
import { updatePhoto } from '@/api/travelApi';
// Components
import FormField from '@/components/ui/FormField';
import TextAreaInput from '@/components/ui/TextAreaInput';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import CheckboxInput from '@/components/ui/CheckboxInput';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { COUNTRY_OPTIONS } from '@/utils/map/countries';
import { toDateInput } from '@/utils/functions/dates';

// An editor's changes to one photo: caption, country, trip, date, and whether viewers see it.
// `trips` is the map's trip list; leave it out where moving between trips isn't possible.
function PhotoEditForm({ photo, trips, onSaved, onCancel }) {
  const [form, setForm] = useState({
    caption: photo.caption || '',
    countryCode: photo.countryCode || '',
    tripId: photo.tripId || '',
    takenOn: toDateInput(photo.takenAt),
    hidden: Boolean(photo.hidden),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        caption: form.caption.trim() || null,
        countryCode: form.countryCode || null,
        takenAt: form.takenOn ? `${form.takenOn}T12:00:00.000Z` : null,
        hidden: form.hidden,
        ...(trips ? { tripId: form.tripId || null } : {}),
      };
      const { photo: saved } = await updatePhoto(photo.id, body);
      onSaved(saved);
    } catch (err) {
      setError(err.friendlyMessage || 'The photo could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-3' noValidate>
      <FormField id='photo-caption' label='Caption'>
        <TextAreaInput value={form.caption} onChange={set('caption')} rows={2} maxLength={500} />
      </FormField>
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id='photo-country' label='Country'>
          <PlainOptionSelect
            value={form.countryCode}
            onChange={set('countryCode')}
            options={[{ value: '', label: 'Not set' }, ...COUNTRY_OPTIONS]}
          />
        </FormField>
        <FormField id='photo-date' label='Taken on'>
          <TextInput type='date' value={form.takenOn} onChange={set('takenOn')} />
        </FormField>
      </div>
      {trips ? (
        <FormField id='photo-trip' label='Trip'>
          <PlainOptionSelect
            value={form.tripId}
            onChange={set('tripId')}
            options={[{ value: '', label: 'No trip' }, ...trips.map((t) => ({ value: t.id, label: t.title }))]}
          />
        </FormField>
      ) : null}
      <CheckboxInput
        id='photo-hidden'
        checked={form.hidden}
        onChange={set('hidden')}
        label='Hide from viewers (only you and the editors see it)'
      />
      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' busy={saving}>
          Save
        </Button>
      </div>
    </form>
  );
}

export default PhotoEditForm;
