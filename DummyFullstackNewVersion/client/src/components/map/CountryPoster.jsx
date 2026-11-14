import React from 'react';
// Components
import ResponsiveImage from '@/components/common/ResponsiveImage';
import PosterPlaceholder from './PosterPlaceholder';
// Data
import { postersFor } from '@/utils/map/posterData';

// my_planet's travel posters: "advertise the countries you haven't been to yet".
// The country's main poster, or a placeholder card when it has none.
function CountryPoster({ code, countryName }) {
  const [poster] = postersFor(code);
  return (
    <figure className='grid gap-1'>
      {poster ? (
        <ResponsiveImage
          folder='posters'
          name={poster.name}
          ratio={poster.ratio}
          alt={`Travel poster for ${countryName}`}
          sizes='(min-width: 768px) 24rem, 90vw'
          className='overflow-hidden rounded-lg border-2 border-map-edge'
        />
      ) : (
        <PosterPlaceholder countryName={countryName} />
      )}
      <figcaption className='text-xs opacity-80'>Somewhere to go next?</figcaption>
    </figure>
  );
}

export default CountryPoster;
