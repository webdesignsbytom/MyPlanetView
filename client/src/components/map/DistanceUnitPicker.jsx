import React from 'react';
// Components
import RadioInput from '@/components/ui/RadioInput';
// Utils
import { DISTANCE_CHOICES } from '@/utils/map/distanceUnits';

// How the statistics and the flight log write distances: kilometres or miles (25 Nov 2026, the
// user's wish: just the two). `value` is the unit in use (distanceUnitFor), so until the viewer
// chooses, the one the map's home gives is ticked: miles in the United States and the UK,
// kilometres elsewhere. The other unit is always beside it. A group of radio buttons, headed
// like the settings panel's switch groups.
function DistanceUnitPicker({ value, onChange }) {
  return (
    <fieldset className='grid gap-2'>
      <legend className='pb-3 font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>Distances</legend>
      {DISTANCE_CHOICES.map((unit) => (
        <RadioInput
          key={unit.id}
          id={`distance-unit-${unit.id}`}
          name='distanceUnit'
          value={unit.id}
          checked={value === unit.id}
          onChange={() => onChange(unit.id)}
          label={unit.label}
        />
      ))}
    </fieldset>
  );
}

export default DistanceUnitPicker;
