import React, { useEffect, useId, useRef, useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import GoalPlacesPicker from './GoalPlacesPicker';
// Utils
import { GOAL_KIND_OPTIONS, GOAL_REGION_GROUPS, GOAL_TARGET_MAX, GOAL_TITLE_MAX } from '@/utils/achievements/goals';
import { serverText } from '@/utils/regex/regex';

const number = (n) => Number(n).toLocaleString('en-GB');
const KIND_LABELS = Object.fromEntries(GOAL_KIND_OPTIONS.map((o) => [o.value, o.label]));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const changedFields = (goal, body) => Object.fromEntries(Object.entries(body).filter(([key, value]) => !same(goal[key], value)));

// What a deadline means for each kind (a hand-ticked country has no date)
const DEADLINE_HINTS = {
  LANDMARK_COUNT: 'With a deadline, only stamps whose photo was taken by the end of that day count.',
  default:
    'With a deadline, a country only counts once a photo taken there by the end of that day proves it: a country ticked by hand has no date.',
};

/**
 * A goal, new or (`goal`) being changed (docs/API.md, "Badges and goals"): its kind (fixed
 * once made), what it asks (a number of countries or stamps, a bucket list of places, or a
 * region or continent), an optional name and an optional deadline, which the form says
 * counts only what a photo proves. A bucket list can start from the map's "want to go"
 * countries (`wantToGo`). `onSave(body)` sends it and throws the server's refusal.
 */
function GoalForm({ goal = null, wantToGo = [], onSave, onCancel }) {
  const uid = useId();
  const [form, setForm] = useState(() => ({
    kind: goal?.kind || 'COUNTRY_COUNT',
    title: goal?.title || '',
    target: goal?.target ? String(goal.target) : '',
    countryCodes: goal?.countryCodes || [],
    region: goal?.region || '',
    deadline: goal?.deadline || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const isNew = !goal;
  // Opening, focus goes to the form's first field (the button that opened it is gone)
  const formRef = useRef(null);
  useEffect(() => {
    formRef.current?.querySelector('select, input')?.focus();
  }, []);
  const counts = form.kind === 'COUNTRY_COUNT' || form.kind === 'LANDMARK_COUNT';
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // What the kind asks for, checked as the server checks it (it has the last word)
  const whatsAsked = () => {
    if (counts) {
      const target = Number(form.target);
      const max = GOAL_TARGET_MAX[form.kind];
      const unit = form.kind === 'LANDMARK_COUNT' ? 'stamps' : 'countries';
      return Number.isInteger(target) && target >= 1 && target <= max
        ? { target }
        : { error: `Say how many ${unit}: a whole number from 1 to ${number(max)}.` };
    }
    if (form.kind === 'COUNTRY_LIST') {
      return form.countryCodes.length ? { countryCodes: form.countryCodes } : { error: 'Add at least one place to the list.' };
    }
    return form.region ? { region: form.region } : { error: 'Choose a region or a continent.' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const asked = whatsAsked();
    if (asked.error) return setError(asked.error);
    const body = { ...asked, title: serverText(form.title) ? form.title : null, deadline: form.deadline || null };
    setSaving(true);
    try {
      // A change sends only what changed: changing what's asked (not the name) means the
      // goal has to be met again, so a renamed goal keeps the day it was reached
      await onSave(isNew ? { kind: form.kind, ...body } : changedFields(goal, body));
    } catch (err) {
      setError(err.friendlyMessage || 'The goal could not be saved.');
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='grid gap-3' noValidate aria-label={isNew ? 'New goal' : 'Change the goal'}>
      {isNew ? (
        <FormField id={`${uid}-kind`} label='What kind of goal'>
          <PlainOptionSelect value={form.kind} onChange={set('kind')} options={GOAL_KIND_OPTIONS} />
        </FormField>
      ) : (
        <p className='text-sm'>
          <span className='font-medium'>Kind:</span> {KIND_LABELS[form.kind]}
        </p>
      )}

      {counts ? (
        <FormField id={`${uid}-target`} label={form.kind === 'LANDMARK_COUNT' ? 'How many stamps' : 'How many countries'} required>
          <TextInput
            type='number'
            inputMode='numeric'
            min={1}
            max={GOAL_TARGET_MAX[form.kind]}
            step={1}
            value={form.target}
            onChange={set('target')}
            required
          />
        </FormField>
      ) : form.kind === 'COUNTRY_LIST' ? (
        <GoalPlacesPicker
          idPrefix={`${uid}-places`}
          codes={form.countryCodes}
          wantToGo={wantToGo}
          onChange={(countryCodes) => setForm((prev) => ({ ...prev, countryCodes }))}
        />
      ) : (
        <FormField id={`${uid}-region`} label='Which region or continent' required>
          <GroupedOptionSelect value={form.region} onChange={set('region')} groups={GOAL_REGION_GROUPS} placeholder='Choose one' required />
        </FormField>
      )}

      <FormField id={`${uid}-title`} label='Name it (optional)' hint='Left empty, the goal is named from what it asks.'>
        <TextInput value={form.title} onChange={set('title')} maxLength={GOAL_TITLE_MAX} />
      </FormField>
      <FormField id={`${uid}-deadline`} label='Deadline (optional)' hint={DEADLINE_HINTS[form.kind] || DEADLINE_HINTS.default}>
        <TextInput type='date' value={form.deadline} onChange={set('deadline')} min='1900-01-01' max='2200-01-01' />
      </FormField>

      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' busy={saving}>
          {isNew ? 'Add goal' : 'Save goal'}
        </Button>
      </div>
    </form>
  );
}

export default GoalForm;
