import React, { useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import SwitchInput from '@/components/ui/SwitchInput';
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
 * The map's set-up: who it's for, the travellers, its name, and whether it shows the UK
 * as England, Scotland, Wales and Northern Ireland (off by default; docs/API.md "The UK's
 * nations"). `onSubmit(form)` saves; `canRename` is false for editors (only the owner names
 * the map, sets its group and splits the UK). `splitUkNote`: what changing it does to a map
 * that has places already (the settings panel; a new map has none).
 */
function MapSetupForm({ initial, onSubmit, submitLabel = 'Save', canRename = true, splitUkNote = false, wideSubmit = false }) {
  const [form, setForm] = useState(() => ({
    name: initial.name || '',
    groupType: initial.groupType || 'SOLO',
    splitUk: Boolean(initial.splitUk),
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

      {canRename ? (
        <div className='grid gap-1'>
          <SwitchInput
            id='map-split-uk'
            name='splitUk'
            label='Show the UK as England, Scotland, Wales and Northern Ireland'
            checked={form.splitUk}
            onChange={(e) => {
              setSaved(false);
              setForm((prev) => ({ ...prev, splitUk: e.target.checked }));
            }}
            ariaDescribedBy='map-split-uk-hint'
          />
          <p id='map-split-uk-hint' className='text-sm opacity-80'>
            Each one is then its own country on your map, with its own photos, and counts as one.
            {splitUkNote
              ? ' Turning it on puts your UK photos and places with a location in their nation; anything else stays in the United Kingdom for you to place. Turning it off puts them all back in the United Kingdom.'
              : ''}
          </p>
        </div>
      ) : null}

      <InlineAlert>{error}</InlineAlert>
      {saved ? <InlineAlert tone='good'>Saved.</InlineAlert> : null}
      {/* `wideSubmit`: across the form (Settings' Save map, 17 Nov 2026, the user's wish) */}
      <div className={wideSubmit ? 'grid' : 'grid justify-end'}>
        <Button type='submit' busy={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default MapSetupForm;
