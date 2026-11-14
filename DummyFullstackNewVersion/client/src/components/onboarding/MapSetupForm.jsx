import React, { useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import GroupTypePicker from './GroupTypePicker';
import TravellerFieldset from './TravellerFieldset';
// Utils
import { minTravellersFor } from '@/utils/map/saveMapSetup';

const blankTraveller = () => ({ name: '', birthCountryCode: '', favouriteCountryCode: '' });

const padTravellers = (travellers, groupType) => {
  const list = [...travellers];
  while (list.length < minTravellersFor(groupType)) list.push(blankTraveller());
  return list;
};

// A suggested map name from the group and the first names given
function suggestName(groupType, travellers) {
  const names = travellers.map((t) => t.name.trim()).filter(Boolean);
  if (groupType === 'COUPLE' && names.length >= 2) return `${names[0]} & ${names[1]}'s travels`;
  if (groupType === 'FAMILY' && names.length) return `${names[0]}'s family travels`;
  if (names.length) return `${names[0]}'s travels`;
  return 'My map';
}

/**
 * The map's set-up: who it's for, the travellers and its name. `onSubmit(form)` saves;
 * `canRename` is false for editors (only the owner names the map and sets its group).
 */
function MapSetupForm({ initial, onSubmit, submitLabel = 'Save', canRename = true }) {
  const [form, setForm] = useState(() => ({
    name: initial.name || '',
    groupType: initial.groupType || 'SOLO',
    travellers: padTravellers(
      (initial.travellers || []).map((t) => ({
        id: t.id,
        name: t.name || '',
        birthCountryCode: t.birthCountryCode || '',
        favouriteCountryCode: t.favouriteCountryCode || '',
      })),
      initial.groupType || 'SOLO',
    ),
  }));
  const [nameTouched, setNameTouched] = useState(Boolean(initial.name) && initial.name !== 'My map');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const update = (patch) => {
    setSaved(false);
    setForm((prev) => {
      const next = { ...prev, ...patch };
      next.travellers = padTravellers(next.travellers, next.groupType);
      if (!nameTouched) next.name = suggestName(next.groupType, next.travellers);
      return next;
    });
  };

  const setTraveller = (index, traveller) =>
    update({ travellers: form.travellers.map((t, i) => (i === index ? traveller : t)) });
  const removeTraveller = (index) => update({ travellers: form.travellers.filter((_, i) => i !== index) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('Give the map a name.');
    if (!form.travellers.some((t) => t.name.trim())) return setError('Add at least one traveller’s name.');
    setSaving(true);
    try {
      await onSubmit(form);
      setSaved(true);
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'The map could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const min = minTravellersFor(form.groupType);

  return (
    <form onSubmit={handleSubmit} className='grid gap-5' noValidate>
      {canRename ? <GroupTypePicker value={form.groupType} onChange={(groupType) => update({ groupType })} /> : null}

      <div className='grid gap-3'>
        {form.travellers.map((traveller, index) => (
          <TravellerFieldset
            key={traveller.id || `new-${index}`}
            index={index}
            traveller={traveller}
            onChange={(next) => setTraveller(index, next)}
            onRemove={() => removeTraveller(index)}
            canRemove={form.travellers.length > min}
          />
        ))}
        {form.groupType !== 'SOLO' ? (
          <button
            type='button'
            onClick={() => update({ travellers: [...form.travellers, blankTraveller()] })}
            className='justify-self-start text-sm font-medium text-colour6 underline underline-offset-2'
          >
            Add another traveller
          </button>
        ) : null}
      </div>

      {canRename ? (
        <FormField id='map-name' label='Map name' hint='Only the people you share it with see this.'>
          <TextInput
            value={form.name}
            maxLength={80}
            onChange={(e) => {
              setNameTouched(true);
              setSaved(false);
              setForm((prev) => ({ ...prev, name: e.target.value }));
            }}
          />
        </FormField>
      ) : null}

      <InlineAlert>{error}</InlineAlert>
      {saved ? <InlineAlert tone='good'>Saved.</InlineAlert> : null}
      <div className='grid justify-end'>
        <Button type='submit' busy={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default MapSetupForm;
