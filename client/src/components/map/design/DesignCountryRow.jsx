import React, { memo } from 'react';
// Components
import Button from '@/components/common/Button';
import { COLOUR_INPUT } from './DesignColourField';

// One place in a map design's country colours: its name, its colour (the usual one until
// one is chosen) and a button back to the usual one. Memoised: a colour picker's every move
// re-renders only its own row.
function DesignCountryRow({ code, name, colour, usual, onChange }) {
  return (
    <li className='grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 py-1' data-design-place={code}>
      <span className='text-sm'>{name}</span>
      <input
        type='color'
        aria-label={`Colour of ${name}`}
        value={colour || usual}
        onChange={(e) => onChange(code, e.target.value)}
        className={COLOUR_INPUT}
      />
      <Button small quiet disabled={!colour} onClick={() => onChange(code, null)} ariaLabel={`${name}: back to the usual colour`}>
        Usual
      </Button>
    </li>
  );
}

export default memo(DesignCountryRow);
