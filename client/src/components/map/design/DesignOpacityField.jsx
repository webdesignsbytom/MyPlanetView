import React from 'react';
// Utils
import { splitOpacity, withOpacity } from '@/utils/map/mapDesign';

// The see-through end of the opacity slider: never quite invisible, as a string no one can see
// would look lost (the map settings' "Strings" switches hide them)
export const MIN_OPACITY = 10;

/**
 * A design colour's opacity (25 Nov 2026, the user's wish: a see-through string): an "Opacity"
 * slider, 10 to 100% in fives, as a colour picker has none. `value` is the colour as kept
 * ("#rrggbbaa", or "#rrggbb" while fully opaque, or null for the usual one, `usual`); a move
 * hands back the colour with its new opacity. `id` and `label` are its colour field's, so it's
 * named "<label> opacity". Under its colour (DesignColourField `alpha`), or on its own where
 * something sits between them (StringColourFields: a two tone string's second colour).
 */
function DesignOpacityField({ id, label, value, usual, onChange }) {
  const { hex, opacity } = splitOpacity(value || usual);
  return (
    <div className='grid grid-cols-[auto_minmax(0,1fr)_3rem] items-center gap-3' data-colour-opacity=''>
      <label htmlFor={`${id}-opacity`} className='text-sm'>
        Opacity
      </label>
      <input
        id={`${id}-opacity`}
        type='range'
        min={MIN_OPACITY}
        max='100'
        step='5'
        value={Math.max(MIN_OPACITY, opacity)}
        aria-label={`${label} opacity`}
        aria-valuetext={`${opacity}%`}
        onChange={(e) => onChange(withOpacity(hex, Number(e.target.value)))}
        className='w-full cursor-pointer accent-colour6'
      />
      <output htmlFor={`${id}-opacity`} className='text-right text-sm tabular-nums'>
        {opacity}%
      </output>
    </div>
  );
}

export default DesignOpacityField;
