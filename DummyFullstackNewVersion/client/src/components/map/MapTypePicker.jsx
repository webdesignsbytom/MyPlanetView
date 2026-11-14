import React from 'react';
// Media
import { getImageSets } from '@/lib/media/imageManifest';
// Utils
import { MAP_TYPES } from '@/utils/map/mapTypes';

const previewUrl = (name) => {
  const sets = getImageSets(name, { dir: '/src/assets/images/map-styles' });
  return sets.pick('avif', 949) || sets.pick('webp', 949);
};

const DESCRIPTIONS = {
  regular: 'Names, lines and landmarks as you set them',
  detailed: 'Names, lines and landmarks everywhere',
};

// my_planet's map types: Regular, or Detailed (every label and pin at every zoom).
function MapTypePicker({ value, onChange }) {
  return (
    <fieldset className='grid gap-2'>
      <legend className='text-sm font-semibold'>Map type</legend>
      <div className='grid grid-cols-2 gap-2'>
        {MAP_TYPES.map((type) => (
          <label
            key={type.id}
            className={`grid cursor-pointer gap-1 overflow-hidden rounded-lg border-2 bg-map-panel text-map-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 ${
              value === type.id ? 'border-map-edge' : 'border-transparent'
            }`}
          >
            <input
              type='radio'
              name='map-type'
              value={type.id}
              checked={value === type.id}
              onChange={() => onChange(type.id)}
              className='sr-only'
            />
            {type.preview ? (
              <img src={previewUrl(type.preview)} alt='' className='h-16 w-full object-cover' loading='lazy' />
            ) : (
              <span aria-hidden='true' className='grid h-16 w-full place-items-center bg-map-sea'>
                <span className='h-8 w-14 rounded-sm bg-map-land' />
              </span>
            )}
            <span className='grid gap-0.5 px-2 pb-1.5'>
              <span className='text-sm font-medium'>{type.label}</span>
              <span className='text-2xs opacity-80'>{DESCRIPTIONS[type.id]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default MapTypePicker;
