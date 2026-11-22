import React, { useMemo } from 'react';
// Media
import { getImageSets } from '@/lib/media/imageManifest';
// Utils
import { mapStyleById } from '@/utils/map/mapStyles';

// What sits behind the countries: a map design's picture (docs/API.md "Map designs"), the
// style's artwork, or the (animated) sea. Each stays still while the map pans, filling the
// screen (cropped to it).
function MapBackground({ styleId, animatedSea, pictureUrl = null }) {
  const style = mapStyleById(styleId);
  const sets = useMemo(
    () => (style.background ? getImageSets(style.background, { dir: '/src/assets/images/map-styles' }) : null),
    [style.background],
  );

  if (pictureUrl) {
    return (
      <div aria-hidden='true' data-design-picture className='absolute inset-0 bg-map-sea'>
        <img src={pictureUrl} alt='' decoding='async' className='h-full w-full object-cover' />
      </div>
    );
  }

  if (!sets) {
    return (
      <div
        aria-hidden='true'
        className={`absolute inset-0 bg-map-sea ${animatedSea ? 'animate-ocean motion-reduce:animate-none' : ''}`}
      />
    );
  }

  return (
    <picture aria-hidden='true' className='absolute inset-0 bg-map-sea'>
      {sets.avifSet ? <source type='image/avif' srcSet={sets.avifSet} sizes='100vw' /> : null}
      {sets.webpSet ? <source type='image/webp' srcSet={sets.webpSet} sizes='100vw' /> : null}
      <img
        src={sets.pick('jpg', 1200)}
        srcSet={sets.jpgSet}
        sizes='100vw'
        alt=''
        decoding='async'
        className='h-full w-full object-cover'
      />
    </picture>
  );
}

export default MapBackground;
