import React from 'react';

/**
 * Whose badges the suitcase shows: the whole map's ("Everyone") or one traveller's (from
 * the completed trips they were on). Buttons in a labelled group, the chosen one pressed.
 * `value` is null for the map, else a traveller's id.
 */
function BadgeOwnerSwitch({ travellers, value, onChange }) {
  const options = [{ id: null, name: 'Everyone' }, ...travellers];
  return (
    <div role='group' aria-label='Whose badges' className='grid grid-flow-row grid-cols-2 gap-2 sm:grid-cols-3'>
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id ?? 'map'}
            type='button'
            aria-pressed={on}
            onClick={() => onChange(option.id)}
            className={`truncate border-2 px-2 py-1 text-sm font-semibold ${
              on ? 'border-poster-red bg-poster-paper text-poster-red-deep' : 'border-dashed border-poster-brown/60 hover:bg-paper-cream'
            }`}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}

export default BadgeOwnerSwitch;
