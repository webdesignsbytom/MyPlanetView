import React from 'react';
// Components
import Button from '@/components/common/Button';

// The look of a colour picker in a map design's settings
export const COLOUR_INPUT = 'h-9 w-12 cursor-pointer border-2 border-poster-brown bg-field p-0.5';

// One colour of a map design (the names, the grid; docs/API.md "Map designs"): the browser's
// own colour picker (it works with the keyboard and on phones), showing the usual colour
// until one is chosen, and a button back to the usual one.
function DesignColourField({ id, label, value, usual, onChange }) {
  return (
    <div className='grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2'>
      <label htmlFor={id} className='text-sm font-medium'>
        {label}
      </label>
      <input id={id} type='color' value={value || usual} onChange={(e) => onChange(e.target.value)} className={COLOUR_INPUT} />
      <Button small quiet disabled={!value} onClick={() => onChange(null)} ariaLabel={`${label}: back to the usual colour`}>
        Usual
      </Button>
    </div>
  );
}

export default DesignColourField;
