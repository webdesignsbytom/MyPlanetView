import React, { useId, useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import TripTravellerChips from './TripTravellerChips';
// Utils
import { TRIP_STATUSES } from '@/utils/trips/tripStatus';

// A trip's details: new (empty `initial`) or editing. `onSubmit(body)` saves. Its field
// ids are its own: the trip page's h1 is #trip-title, and the form sits under it.
function TripForm({ initial = {}, travellers = [], onSubmit, onCancel, submitLabel = 'Create trip', showTravellers = true }) {
  const uid = useId();
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    status: initial.status || 'PLANNED',
    startDate: initial.startDate || '',
    endDate: initial.endDate || '',
    travellerIds: initial.travellerIds || travellers.map((t) => t.id),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError('Give the trip a title.');
    if (form.startDate && form.endDate && form.endDate < form.startDate) return setError('The trip ends before it starts.');
    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        ...(showTravellers ? { travellerIds: form.travellerIds } : {}),
      });
    } catch (err) {
      setError(err.friendlyMessage || 'The trip could not be saved.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-3' noValidate>
      <FormField id={`${uid}-title`} label='Title' required>
        <TextInput value={form.title} onChange={set('title')} maxLength={120} required />
      </FormField>
      <FormField id={`${uid}-status`} label='Status'>
        <PlainOptionSelect value={form.status} onChange={set('status')} options={TRIP_STATUSES} />
      </FormField>
      {/* Two columns at most, the map panel is narrow; grid-cols-1 lets a date field shrink to its column */}
      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${uid}-start`} label='From' className='grid grid-cols-1 gap-y-2'>
          <TextInput type='date' value={form.startDate} onChange={set('startDate')} />
        </FormField>
        <FormField id={`${uid}-end`} label='To' className='grid grid-cols-1 gap-y-2'>
          <TextInput type='date' value={form.endDate} onChange={set('endDate')} min={form.startDate || undefined} />
        </FormField>
      </div>
      <FormField id={`${uid}-description`} label='Notes'>
        <TextAreaInput value={form.description} onChange={set('description')} rows={3} maxLength={2000} />
      </FormField>
      {showTravellers ? (
        <TripTravellerChips
          travellers={travellers}
          selectedIds={form.travellerIds}
          onChange={(travellerIds) => setForm((prev) => ({ ...prev, travellerIds }))}
        />
      ) : null}
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

export default TripForm;
