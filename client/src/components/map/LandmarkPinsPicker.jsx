import React from 'react';
// Components
import RadioInput from '@/components/ui/RadioInput';
// Utils
import { LANDMARK_PIN_MODES } from '@/utils/map/mapSettings';

// When the map shows its landmark pins (17 Nov 2026, the user's wish: finer control of the
// dots): when zoomed in, always, only the landmarks stamped in the map's passport, or never.
// A group of radio buttons, headed like the settings panel's switch groups.
function LandmarkPinsPicker({ value, onChange }) {
  return (
    <fieldset className='grid gap-2'>
      <legend className='pb-3 font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>Landmark pins</legend>
      {LANDMARK_PIN_MODES.map((mode) => (
        <RadioInput
          key={mode.id}
          id={`landmark-pins-${mode.id}`}
          name='landmarkPins'
          value={mode.id}
          checked={value === mode.id}
          onChange={() => onChange(mode.id)}
          label={mode.label}
        />
      ))}
    </fieldset>
  );
}

export default LandmarkPinsPicker;
