import React from 'react';
// Components
import PosterImage from './PosterImage';
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
        <PosterImage
          poster={poster}
          alt={`Travel poster for ${countryName}`}
          className='overflow-hidden border-8 border-poster-cream shadow-paper'
        />
      ) : (
        <PosterPlaceholder countryName={countryName} />
      )}
      <figcaption className='text-xs opacity-80'>Somewhere to go next?</figcaption>
    </figure>
  );
}

export default CountryPoster;
