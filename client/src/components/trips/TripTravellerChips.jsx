import React from 'react';

// A small paper tag: parchment, brown edge, the warm shadow. 40px tall on touch screens.
const TAG = 'border-2 px-3 py-1 text-sm transition pointer-coarse:py-2';

// Who went (or is going): one toggle tag per traveller on the map. A chosen traveller's
// tag is parchment edged in red; the others are dashed outlines waiting to be picked.
// Read-only when `onChange` is missing: only the chosen travellers' tags show.
// `legend` names the group (a moment's form: "Who it’s about").
function TripTravellerChips({ travellers, selectedIds, onChange, disabled = false, legend = 'Who’s going' }) {
  if (!travellers?.length) return null;
  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <fieldset className='grid gap-2'>
      <legend className='font-travel text-base uppercase tracking-wide text-poster-brown'>{legend}</legend>
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
              className={`${TAG} disabled:opacity-50 ${
                on ? 'paper-aged border-poster-red text-poster-ink shadow-paper' : 'border-dashed border-poster-brown/60 hover:border-solid hover:border-poster-brown'
              }`}
            >
              {traveller.name}
            </button>
          ) : on ? (
            <span key={traveller.id} className={`${TAG} paper-aged border-poster-brown text-poster-ink shadow-paper`}>
              {traveller.name}
            </span>
          ) : null;
        })}
      </div>
    </fieldset>
  );
}

export default TripTravellerChips;
