import React, { useEffect, useRef, useState } from 'react';
// Components
import VisitStatusSelect from './VisitStatusSelect';
// Utils
import { VISIT_STATUS_LABELS } from '@/utils/map/visitStatus';

// A country's status in the country list. 224 dropdowns made the list slow to open, so
// each row shows a button drawn like the closed dropdown, and only the row being changed
// gets the real one: pressing the button (click, tap, Enter or Space) swaps the dropdown
// in, focused and, where the browser allows, already open. Once focus leaves it, it's a
// button again. Screen readers hear "Status for France: Visited, button", then the
// dropdown itself, so every row can still be reached and changed from the keyboard.
function CountryStatusControl({ code, countryName, status, onChange }) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef(null);
  const label = status ? VISIT_STATUS_LABELS[status] : 'Not yet';

  useEffect(() => {
    if (!editing) return;
    const select = selectRef.current;
    select?.focus();
    try {
      // The press still counts as the user's gesture here
      select?.showPicker?.();
    } catch {
      // Not supported (Safari) or not allowed: it's focused, so a second press opens it
    }
  }, [editing]);

  if (editing) {
    return (
      <VisitStatusSelect
        refProp={selectRef}
        id={`status-${code}`}
        countryName={countryName}
        status={status}
        onChange={(next) => onChange(code, next)}
        onBlur={(e) => {
          // Focus moving into the dropdown's own list isn't leaving it
          if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
          setEditing(false);
        }}
      />
    );
  }

  return (
    <button
      type='button'
      onClick={() => setEditing(true)}
      aria-haspopup='listbox'
      aria-label={`Status for ${countryName}: ${label}`}
      className='app-select grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left'
    >
      <span className='truncate'>{label}</span>
      <span aria-hidden='true'>▾</span>
    </button>
  );
}

export default CountryStatusControl;
