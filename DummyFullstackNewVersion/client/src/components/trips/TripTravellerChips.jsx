import React from 'react';

// Who went (or is going): one toggle chip per traveller on the map.
// Read-only when `onChange` is missing.
function TripTravellerChips({ travellers, selectedIds, onChange, disabled = false }) {
  if (!travellers?.length) return null;
  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <fieldset className='grid gap-2'>
      <legend className='text-sm font-medium'>Who’s going</legend>
      <div className='grid grid-row-wrap gap-2'>
        {travellers.map((traveller) => {
          const on = selectedIds.includes(traveller.id);
          return onChange ? (
            <button
              key={traveller.id}
              type='button'
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(traveller.id)}
              className={`rounded-full border px-3 py-1 text-sm transition disabled:opacity-50 ${
                on ? 'border-colour6 bg-colour6 text-colour1' : 'border-colour5/40 hover:border-colour5'
              }`}
            >
              {traveller.name}
            </button>
          ) : on ? (
            <span key={traveller.id} className='rounded-full border border-colour5/40 px-3 py-1 text-sm'>
              {traveller.name}
            </span>
          ) : null;
        })}
      </div>
    </fieldset>
  );
}

export default TripTravellerChips;
