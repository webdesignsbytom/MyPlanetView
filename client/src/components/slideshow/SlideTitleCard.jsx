import React from 'react';
// Components
import PosterImage from '@/components/map/PosterImage';
import PosterPlaceholder from '@/components/map/PosterPlaceholder';
// Data
import { postersFor } from '@/utils/map/posterData';
// Utils
import { countryName } from '@/utils/map/countries';

/**
 * The worldwide show's title card when the country changes: the country's travel poster
 * (a placeholder card for one without) beside its name, stamped like a passport entry.
 */
function SlideTitleCard({ countryCode, first = false }) {
  const [poster] = postersFor(countryCode);
  const name = countryName(countryCode);

  return (
    <div className='grid w-full max-w-3xl content-center items-center justify-items-center gap-4 sm:grid-cols-2'>
      {poster ? (
        <PosterImage
          poster={poster}
          alt={`Travel poster for ${name}`}
          // No cream border: the posters have their own printed one (17 Nov 2026)
          className='w-40 -rotate-2 overflow-hidden shadow-paper sm:w-56 lg:w-64'
        />
      ) : (
        <div className='w-40 -rotate-2 sm:w-56 lg:w-64'>
          <PosterPlaceholder countryName={name} />
        </div>
      )}
      <div className='grid justify-items-center gap-2 text-center sm:justify-items-start sm:text-left'>
        <p className='font-travel text-sm uppercase tracking-xl text-poster-brown'>{first ? 'First stop' : 'Next stop'}</p>
        <p className='-rotate-2 border-4 border-double border-poster-red px-4 py-2 font-travel text-4xl uppercase leading-none text-poster-red text-stroke-poster sm:text-5xl'>
          {name}
        </p>
      </div>
    </div>
  );
}

export default SlideTitleCard;
