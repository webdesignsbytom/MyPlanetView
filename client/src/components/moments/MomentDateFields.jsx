import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { DATE_PRECISION_OPTIONS, MONTH_OPTIONS } from '@/utils/moments/momentDates';

// When a moment happened, as much as is known: a day (a date picker), a month (the month
// and the year), only the year, or no date at all. `value` is momentDateFields' shape. Side
// by side on wide screens (lg, as MomentForm's fields), else one to a row.
function MomentDateFields({ idPrefix, value, onChange }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const yearField = (
    <FormField id={`${idPrefix}-year`} label='Year' className='grid grid-cols-1 gap-y-2' align='start'>
      <TextInput value={value.year} onChange={set('year')} inputMode='numeric' maxLength={4} pattern='[0-9]{4}' placeholder='2019' />
    </FormField>
  );

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <FormField id={`${idPrefix}-when`} label='When' align='start'>
        <PlainOptionSelect value={value.precision} onChange={set('precision')} options={DATE_PRECISION_OPTIONS} />
      </FormField>
      {value.precision === 'DAY' ? (
        <FormField id={`${idPrefix}-day`} label='Day' className='grid grid-cols-1 gap-y-2' align='start'>
          <TextInput type='date' value={value.day} onChange={set('day')} min='1800-01-01' max='2200-12-31' />
        </FormField>
      ) : null}
      {value.precision === 'MONTH' ? (
        <>
          <FormField id={`${idPrefix}-month`} label='Month' align='start'>
            <PlainOptionSelect value={value.month} onChange={set('month')} options={MONTH_OPTIONS} placeholder='Choose a month' />
          </FormField>
          {yearField}
        </>
      ) : null}
      {value.precision === 'YEAR' ? yearField : null}
    </div>
  );
}

export default MomentDateFields;
