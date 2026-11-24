import React from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { splitOpacity, withOpacity } from '@/utils/map/mapDesign';

// The look of a colour picker in a map design's settings
export const COLOUR_INPUT = 'h-9 w-12 cursor-pointer border-2 border-poster-brown bg-field p-0.5';

// The see-through end of the opacity slider: never quite invisible, as a string no one can see
// would look lost (the map settings' "Strings" switch hides them)
export const MIN_OPACITY = 10;

// One colour of a map design (the names, the grid; docs/API.md "Map designs"): the browser's
// own colour picker (it works with the keyboard and on phones), showing the usual colour
// until one is chosen, and a button back to the usual one.
// `alpha` (the strings' colour; 25 Nov 2026, the user's wish: a see-through string): an
// "Opacity" slider on a row of its own under it, as a colour picker has no opacity; the
// colour is then "#rrggbbaa" (or "#rrggbb" while fully opaque).
function DesignColourField({ id, label, value, usual, onChange, alpha = false }) {
  const { hex, opacity } = splitOpacity(value || usual);
  return (
    <div className='grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2'>
      <label htmlFor={id} className='text-sm font-medium'>
        {label}
      </label>
      <input
        id={id}
        type='color'
        value={hex}
        onChange={(e) => onChange(alpha ? withOpacity(e.target.value, opacity) : e.target.value)}
        className={COLOUR_INPUT}
      />
      <Button small quiet disabled={!value} onClick={() => onChange(null)} ariaLabel={`${label}: back to the usual colour`}>
        Usual
      </Button>
      {alpha ? (
        <div className='col-span-3 grid grid-cols-[auto_minmax(0,1fr)_3rem] items-center gap-3' data-colour-opacity=''>
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
      ) : null}
    </div>
  );
}

export default DesignColourField;
