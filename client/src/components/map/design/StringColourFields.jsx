import React from 'react';
// Components
import CheckboxInput from '@/components/ui/CheckboxInput';
import DesignColourField from './DesignColourField';
import DesignOpacityField from './DesignOpacityField';
// Utils
import { STRING_DESIGNS } from '@/utils/map/mapDesign';

/**
 * One kind of string's colours in the map's design (docs/API.md "Map designs"): its colour with
 * an opacity (25 Nov 2026, the user's wish: see-through strings), and a second colour twisted in,
 * as baker's twine. In the Strings panel's tab for that kind (25 Nov 2026, the user's wish: the
 * strings' colours "all in one place", the visited and the planned each their own; they were in
 * Settings). `design` is the editor's, `usual` the map style's own `{ colour, twist }`, and
 * `onChange(patch)` the editor's `change`. Ticked, the twist starts as the style's usual one;
 * its "Usual" goes back to that, and unticking makes the strings one colour again. The opacity
 * slider sits under the colour, and under the second colour once there is one (25 Nov 2026, the
 * user's wish): it's the whole twine's.
 */
function StringColourFields({ id, kind = 'VISITED', design, usual, onChange }) {
  const { colour, twist } = STRING_DESIGNS[kind];
  const value = design?.[colour] ?? null;
  const twisted = design?.[twist] ?? null;
  const setColour = (next) => onChange({ [colour]: next });
  return (
    <div className='grid gap-3' data-string-colours={kind}>
      <DesignColourField id={`${id}-colour`} label='String colour' value={value} usual={usual.colour} onChange={setColour} alpha opacityBelow={!twisted} />
      <CheckboxInput
        id={`${id}-twist`}
        checked={Boolean(twisted)}
        onChange={(e) => onChange({ [twist]: e.target.checked ? usual.twist : null })}
        label='Two tone string'
      />
      {twisted ? (
        <>
          <DesignColourField
            id={`${id}-twist-colour`}
            label='Second string colour'
            value={twisted === usual.twist ? null : twisted}
            usual={usual.twist}
            onChange={(next) => onChange({ [twist]: next ?? usual.twist })}
          />
          <DesignOpacityField id={`${id}-colour`} label='String colour' value={value} usual={usual.colour} onChange={setColour} />
        </>
      ) : null}
    </div>
  );
}

export default StringColourFields;
