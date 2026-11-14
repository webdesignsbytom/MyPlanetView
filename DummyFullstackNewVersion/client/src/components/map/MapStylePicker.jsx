import React from 'react';
// Media
import { getImageSets } from '@/lib/media/imageManifest';
// Utils
import { MAP_STYLES } from '@/utils/map/mapStyles';

const previewUrl = (name) => {
  const sets = getImageSets(name, { dir: '/src/assets/images/map-styles' });
  return sets.pick('avif', 800) || sets.pick('webp', 800) || sets.pick('jpg', 800);
};

// The four looks of the map, each previewed in its own colours (the preview carries the
// style's data-map-style, so its tokens apply to it).
function MapStylePicker({ value, onChange }) {
  return (
    <fieldset className='grid gap-2'>
      <legend className='text-sm font-semibold'>Map style</legend>
      <div className='grid grid-cols-2 gap-2'>
        {MAP_STYLES.map((style) => (
          <label
            key={style.id}
            data-map-style={style.id}
            className={`grid cursor-pointer gap-1 overflow-hidden rounded-lg border-2 bg-map-panel text-map-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 ${
              value === style.id ? 'border-map-edge' : 'border-transparent'
            }`}
          >
            <input
              type='radio'
              name='map-style'
              value={style.id}
              checked={value === style.id}
              onChange={() => onChange(style.id)}
              className='sr-only'
            />
            {style.background ? (
              <img src={previewUrl(style.background)} alt='' className='h-16 w-full object-cover' loading='lazy' />
            ) : (
              <span aria-hidden='true' className='block h-16 w-full bg-map-sea' />
            )}
            <span className='px-2 pb-1.5 text-sm font-medium'>{style.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default MapStylePicker;
