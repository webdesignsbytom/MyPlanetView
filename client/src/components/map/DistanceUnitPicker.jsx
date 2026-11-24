import React from 'react';
// Components
import RadioInput from '@/components/ui/RadioInput';
// Utils
import { DISTANCE_UNITS } from '@/utils/map/distanceUnits';

// How the statistics and the flight log write distances (24 Nov 2026, the user's wish:
// "Americans in miles always", and a choice): miles for a map whose home is in the United
// States, else kilometres; or always one of them. The other unit is always beside it. A group
// of radio buttons, headed like the settings panel's switch groups.
function DistanceUnitPicker({ value, onChange }) {
  return (
    <fieldset className='grid gap-2'>
      <legend className='pb-3 font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>Distances</legend>
      {DISTANCE_UNITS.map((unit) => (
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
