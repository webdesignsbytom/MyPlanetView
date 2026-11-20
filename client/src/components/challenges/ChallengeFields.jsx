import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { CHALLENGE_MEASURES, CHALLENGE_MEASURE_ORDER } from '@/utils/challenges/challengeWords';
import { CHALLENGE_TARGET_MAX, CHALLENGE_TITLE_MAX } from '@/utils/challenges/challengeForm';

const MEASURE_OPTIONS = CHALLENGE_MEASURE_ORDER.map((measure) => ({ value: measure, label: CHALLENGE_MEASURES[measure].label }));

// A challenge's fields, shared by "Start a challenge" and the starter's changes: title,
// what it counts (fixed once made: `measureFixed`), first and last days, an optional
// target, and for a new one the map that counts (`mapOptions`; null hides it).
// `form` holds the inputs' strings (utils/challenges/challengeForm.js); `onChange(field, value)`.
function ChallengeFields({ idPrefix, form, errors = {}, onChange, measureFixed = false, mapOptions = null }) {
  const set = (field) => (e) => onChange(field, e.target.value);

  return (
    <>
      <FormField id={`${idPrefix}-title`} label='Title' hint='“Most new countries in 2027”, “Summer of landmarks”.' error={errors.title} required>
        <TextInput value={form.title} maxLength={CHALLENGE_TITLE_MAX} onChange={set('title')} autoComplete='off' />
      </FormField>
      <FormField
        id={`${idPrefix}-measure`}
        label='What it counts'
        hint={measureFixed ? 'This stays as it was made.' : CHALLENGE_MEASURES[form.measure]?.description}
        error={errors.measure}
        required
      >
        <PlainOptionSelect value={form.measure} onChange={set('measure')} options={MEASURE_OPTIONS} disabled={measureFixed} />
      </FormField>
      {/* Not stretched to one height: the field without a hint grew, and its input sat
          about 12px off its neighbour's (19 Nov 2026, the audit) */}
      <div className='grid items-start gap-3 sm:grid-cols-2'>
        <FormField id={`${idPrefix}-starts`} label='First day' error={errors.startsOn} required>
          <TextInput type='date' value={form.startsOn} onChange={set('startsOn')} />
        </FormField>
        <FormField id={`${idPrefix}-ends`} label='Last day' hint='Up to two years after the first.' error={errors.endsOn} required>
          <TextInput type='date' value={form.endsOn} onChange={set('endsOn')} />
        </FormField>
      </div>
      <FormField id={`${idPrefix}-target`} label='First to… (optional)' hint='A target makes it a race: “first to 5”. Empty: the most wins.' error={errors.target}>
        <TextInput type='number' inputMode='numeric' min={1} max={CHALLENGE_TARGET_MAX} step={1} value={form.target} onChange={set('target')} />
      </FormField>
      {mapOptions ? (
        <FormField id={`${idPrefix}-map`} label='Your map that counts' hint='One you own or edit. You can change it later.' error={errors.mapId} required>
          <PlainOptionSelect value={form.mapId} onChange={set('mapId')} options={mapOptions} placeholder='Choose a map' />
        </FormField>
      ) : null}
    </>
  );
}

export default ChallengeFields;
