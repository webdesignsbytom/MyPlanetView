import React, { useEffect, useRef, useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';

const EARLIEST = '1900-01-01';
// Typing a date saves after this pause; leaving the field saves at once
const SAVE_PAUSE_MS = 600;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// A date input gives '' until every part is filled in, but a year typed digit by digit
// passes through 0002, 0020 and 0201 first: only a day from 1900 to today counts.
const usable = (date, today) => DATE_ONLY.test(date) && date >= EARLIEST && date <= today;

/**
 * When you first went to a country. It keeps what you type to itself and saves when
 * the date is complete (after a short pause) or when you leave the field. It's never
 * disabled while saving, so focus stays put (the caller marks the form aria-busy).
 * Clearing is deliberate: empty every part and leave the field, or use "Clear date".
 * `onSave(date | null)`.
 */
function FirstVisitDateField({ id, value, onSave }) {
  // null while not being edited: the field shows the saved value
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const today = localToday();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleChange = (e) => {
    const next = e.target.value;
    setDraft(next);
    setError(null);
    clearTimeout(timerRef.current);
    if (usable(next, today) && next !== value) {
      timerRef.current = setTimeout(() => onSave(next), SAVE_PAUSE_MS);
    }
  };

  const handleBlur = (e) => {
    const input = e.target;
    const next = input.value;
    clearTimeout(timerRef.current);
    setDraft(null);
    // Back to the saved date. Set on the element too: clearing one part of a date fires
    // no change event, so React may not know the field differs from what it drew.
    const revert = () => {
      input.value = value || '';
    };
    if (next === '') {
      // Every part emptied on purpose, or a date left half typed (badInput): only the first clears it
      if (input.validity.badInput) revert();
      else if (value) onSave(null);
      return;
    }
    if (!usable(next, today)) {
      setError('Choose a day from 1900 to today. That date wasn’t saved.');
      revert();
      return;
    }
    if (next !== value) onSave(next);
  };

  const clear = () => {
    clearTimeout(timerRef.current);
    setDraft(null);
    setError(null);
    onSave(null);
    // The button goes once the date does: keep focus on the field
    inputRef.current?.focus();
  };

  return (
    <div className='grid content-start gap-1'>
      <FormField id={id} label='First went' error={error}>
        <TextInput
          refProp={inputRef}
          type='date'
          value={draft ?? value ?? ''}
          min={EARLIEST}
          max={today}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </FormField>
      {value ? (
        <button
          type='button'
          onClick={clear}
          className='justify-self-center text-xs underline underline-offset-2 hover:no-underline'
        >
          Clear date
        </button>
      ) : null}
    </div>
  );
}

export default FirstVisitDateField;
