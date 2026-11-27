import React, { useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import SwitchInput from '@/components/ui/SwitchInput';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import SavedStamp from '@/components/common/SavedStamp';
import GroupTypePicker from './GroupTypePicker';
import TravellerFieldset from './TravellerFieldset';
// Utils
import { GROUP_TYPES, NEEDS_A_TRAVELLER, maxTravellersFor, minTravellersFor } from '@/utils/map/saveMapSetup';

const blankTraveller = () => ({ name: '', lastName: '', nationalityCode: '', birthCountryCode: '', favouriteCountryCode: '', birthDate: '' });

const isBlankNew = (t) =>
  !t.id && !t.name.trim() && !t.lastName?.trim() && !t.nationalityCode && !t.birthCountryCode && !t.favouriteCountryCode && !t.birthDate;

// As many rows as the kind of map needs; rows added but never filled in go when it has no
// room for them (a family's third, empty, when it becomes a couple)
const padTravellers = (travellers, groupType) => {
  const list = [...travellers];
  while (list.length < minTravellersFor(groupType)) list.push(blankTraveller());
  while (list.length > maxTravellersFor(groupType) && isBlankNew(list[list.length - 1])) list.pop();
  return list;
};

// As the server says it (EVENT_MESSAGES.soloTooManyTravellers, coupleTooManyTravellers)
const tooManyFor = (groupType) =>
  groupType === 'SOLO' ? '"Just me" is for one traveller: remove the others first.' : '"A couple" is for two travellers: remove the others first.';

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
 * as England, Scotland, Wales and Northern Ireland (on for a new map; docs/API.md "The UK's
 * nations"). `onSubmit(form)` saves; `canRename` is false for editors (only the owner names
 * the map, sets its group and splits the UK). `splitUkNote`: what changing it does to a map
 * that has places already (the settings panel; a new map has none). `saved` and
 * `onSavedChange` keep "Saved" with the parent, as the settings panel builds the form afresh
 * after a save that changes the map (its key), which used to take the stamp away at once.
 * `askBirthDate`: each traveller's optional date of birth (Settings; never /welcome, straight
 * after sign-up: 23 Nov 2026, the user's wish).
 * `typeBehindButton`: who the map is for shows as a line saying so, the choices behind "Change
 * map type" (Settings, where it's set already; 27 Nov 2026, the user's wish), until the form
 * starts afresh after a save.
 */
function MapSetupForm({
  initial,
  onSubmit,
  submitLabel = 'Save',
  canRename = true,
  splitUkNote = false,
  wideSubmit = false,
  askBirthDate = false,
  typeBehindButton = false,
  saved: savedProp,
  onSavedChange,
}) {
  const [typeOpen, setTypeOpen] = useState(!typeBehindButton);
  const [form, setForm] = useState(() => ({
    name: initial.name || '',
    groupType: initial.groupType || 'SOLO',
    splitUk: Boolean(initial.splitUk),
    travellers: padTravellers(
      (initial.travellers || []).map((t) => ({
        id: t.id,
        name: t.name || '',
        lastName: t.lastName || '',
        nationalityCode: t.nationalityCode || '',
        birthCountryCode: t.birthCountryCode || '',
        favouriteCountryCode: t.favouriteCountryCode || '',
        birthDate: t.birthDate || '',
      })),
      initial.groupType || 'SOLO',
    ),
  }));
  const [nameTouched, setNameTouched] = useState(Boolean(initial.name) && initial.name !== 'My map');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedOwn, setSavedOwn] = useState(false);
  const saved = savedProp ?? savedOwn;
  const setSaved = (value) => {
    setSavedOwn(value);
    onSavedChange?.(value);
  };

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
    if (!form.travellers.some((t) => t.name.trim())) return setError(NEEDS_A_TRAVELLER);
    if (form.travellers.filter((t) => t.name.trim()).length > maxTravellersFor(form.groupType)) return setError(tooManyFor(form.groupType));
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
  // A couple's map is two people (17 Nov 2026, the user's wish), just me one, a family up to 20
  const roomForMore = form.travellers.length < maxTravellersFor(form.groupType);

  return (
    <form onSubmit={handleSubmit} className='grid gap-5' noValidate>
      {canRename && typeBehindButton ? (
        <div className='grid gap-2' data-map-type=''>
          <p className='text-sm'>
            <span className='font-medium'>This map is for: </span>
            {GROUP_TYPES.find((type) => type.value === form.groupType)?.label}
          </p>
          <button
            type='button'
            aria-expanded={typeOpen}
            aria-controls='map-type-choices'
            onClick={() => setTypeOpen((open) => !open)}
            className='btn-paper justify-self-start [--btn-leading:1.25rem] [--btn-pad-x:1rem] [--btn-pad-y:0.375rem] [--btn-size:1rem]'
          >
            Change map type
          </button>
        </div>
      ) : null}
      {canRename && typeOpen ? (
        <div id='map-type-choices' className='grid'>
          <GroupTypePicker value={form.groupType} onChange={(groupType) => update({ groupType })} />
        </div>
      ) : null}

      <div className='grid gap-3'>
        {form.travellers.map((traveller, index) => (
          <TravellerFieldset
            key={traveller.id || `new-${index}`}
            index={index}
            traveller={traveller}
            onChange={(next) => setTraveller(index, next)}
            onRemove={() => removeTraveller(index)}
            canRemove={form.travellers.length > min}
            askBirthDate={askBirthDate}
          />
        ))}
        {roomForMore ? (
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
      {saved ? <SavedStamp /> : null}
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
