import React from 'react';
// Components
import Button from '@/components/common/Button';
import DesignOpacityField from './DesignOpacityField';
// Utils
import { splitOpacity, withOpacity } from '@/utils/map/mapDesign';

// The look of a colour picker in a map design's settings
export const COLOUR_INPUT = 'h-9 w-12 cursor-pointer border-2 border-poster-brown bg-field p-0.5';

// One colour of a map design (the names, the grid; docs/API.md "Map designs"): the browser's
// own colour picker (it works with the keyboard and on phones), showing the usual colour
// until one is chosen, and a button back to the usual one.
// `alpha` (the strings' colour; 25 Nov 2026, the user's wish: a see-through string): the colour
// may carry an opacity ("#rrggbbaa", or "#rrggbb" while fully opaque), kept when the colour
// changes, with its "Opacity" slider (DesignOpacityField) on a row of its own under it, unless
// `opacityBelow` is false: then the caller puts the slider where it belongs (a two tone string's
// goes under its second colour: 25 Nov 2026, the user's wish).
function DesignColourField({ id, label, value, usual, onChange, alpha = false, opacityBelow = true }) {
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
      {alpha && opacityBelow ? (
        <div className='col-span-3 grid'>
          <DesignOpacityField id={id} label={label} value={value} usual={usual} onChange={onChange} />
        </div>
      ) : null}
    </div>
  );
}

export default DesignColourField;
