import React, { useState } from 'react';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { COUNTRY_OPTION_GROUPS } from '@/utils/map/countries';

// A stop on a trip: a country (or a special place: Antarctica or a pole, listed after the
// countries), optionally one of its landmarks or a place name, dates and notes.
function TripStopForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Add stop', idPrefix = 'stop' }) {
  const [form, setForm] = useState({
    countryCode: initial.countryCode || '',
    landmarkId: initial.landmarkId || '',
    placeName: initial.placeName || '',
    arriveOn: initial.arriveOn || '',
    leaveOn: initial.leaveOn || '',
    notes: initial.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { landmarks } = useLandmarks(form.countryCode, { enabled: Boolean(form.countryCode) });

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value, ...(key === 'countryCode' ? { landmarkId: '' } : {}) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.countryCode) return setError('Choose a country for this stop.');
    if (form.arriveOn && form.leaveOn && form.leaveOn < form.arriveOn) return setError('You leave before you arrive.');
    setSaving(true);
    try {
      await onSubmit({
        countryCode: form.countryCode,
        landmarkId: form.landmarkId || null,
        placeName: form.placeName.trim() || null,
        arriveOn: form.arriveOn || null,
        leaveOn: form.leaveOn || null,
        notes: form.notes.trim() || null,
      });
      if (!initial.countryCode) setForm({ countryCode: '', landmarkId: '', placeName: '', arriveOn: '', leaveOn: '', notes: '' });
    } catch (err) {
      setError(err.friendlyMessage || 'The stop could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-3' noValidate>
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${idPrefix}-country`} label='Country' required>
          <GroupedOptionSelect
            value={form.countryCode}
            onChange={set('countryCode')}
            groups={COUNTRY_OPTION_GROUPS}
            placeholder='Choose a country'
            required
          />
        </FormField>
        <FormField id={`${idPrefix}-landmark`} label='Landmark'>
          <PlainOptionSelect
            value={form.landmarkId}
            onChange={set('landmarkId')}
            disabled={!landmarks.length}
            options={[{ value: '', label: landmarks.length ? 'None' : 'None known' }, ...landmarks.map((l) => ({ value: l.id, label: l.name }))]}
          />
        </FormField>
      </div>
      <FormField id={`${idPrefix}-place`} label='Town or place'>
        <TextInput value={form.placeName} onChange={set('placeName')} maxLength={120} />
      </FormField>
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${idPrefix}-arrive`} label='Arrive'>
          <TextInput type='date' value={form.arriveOn} onChange={set('arriveOn')} />
        </FormField>
        <FormField id={`${idPrefix}-leave`} label='Leave'>
          <TextInput type='date' value={form.leaveOn} onChange={set('leaveOn')} min={form.arriveOn || undefined} />
        </FormField>
      </div>
      <FormField id={`${idPrefix}-notes`} label='Notes'>
        <TextInput value={form.notes} onChange={set('notes')} maxLength={1000} />
      </FormField>
      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-row justify-end gap-2'>
        {onCancel ? (
          <Button quiet onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type='submit' busy={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default TripStopForm;
