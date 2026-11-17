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
// style's data-map-style, so its sea colour applies to it), as paper cards: the chosen
// one is parchment with a red edge.
function MapStylePicker({ value, onChange }) {
  return (
    <fieldset className='grid gap-2'>
      <legend className='pb-3 font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>Map style</legend>
      <div className='grid grid-cols-2 gap-2'>
        {MAP_STYLES.map((style) => (
          <label
            key={style.id}
            data-map-style={style.id}
            className={`grid cursor-pointer gap-1 overflow-hidden border-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 ${
              value === style.id ? 'paper-aged border-poster-red text-poster-ink shadow-paper' : 'border-dashed border-poster-brown/60 bg-paper-cream'
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
            <span className='px-2 pb-1.5 font-travel text-base uppercase tracking-wide'>{style.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default MapStylePicker;
