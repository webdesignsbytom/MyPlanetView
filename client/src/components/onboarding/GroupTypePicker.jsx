import React from 'react';
// Utils
import { GROUP_TYPES } from '@/utils/map/saveMapSetup';

// Who the map is for: solo, a couple or a family (the old site's account types).
function GroupTypePicker({ value, onChange, name = 'groupType' }) {
  return (
    <fieldset className='grid gap-2'>
      <legend className='text-sm font-medium'>Who is this map for?</legend>
      <div className='grid gap-2 sm:grid-cols-3'>
        {GROUP_TYPES.map((type) => (
          <label
            key={type.value}
            className={`grid cursor-pointer gap-1 border-2 px-4 py-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 ${
              value === type.value ? 'paper-aged border-poster-red text-poster-ink shadow-paper' : 'border-dashed border-poster-brown/60 hover:border-solid hover:border-poster-brown'
            }`}
          >
            <input
              type='radio'
              name={name}
              value={type.value}
              checked={value === type.value}
              onChange={() => onChange(type.value)}
              className='sr-only'
            />
            <span className='font-travel text-lg uppercase leading-tight tracking-wide'>{type.label}</span>
            <span className='text-xs opacity-80'>{type.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default GroupTypePicker;
