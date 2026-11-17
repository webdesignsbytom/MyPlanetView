import React from 'react';
// Components
import PosterImage from '@/components/map/PosterImage';
import PosterPlaceholder from '@/components/map/PosterPlaceholder';
// Data
import { postersFor } from '@/utils/map/posterData';
// Utils
import { countryName } from '@/utils/map/countries';

// The poster: as wide as fits the show's frame at 2:3 (the rems are the frame's title,
// controls and the name under or beside it)
const POSTER_SIZE = 'w-[min(78vw,calc((100svh_-_25rem)*2/3))] sm:w-[min(42vw,34rem,calc((100svh_-_16rem)*2/3))]';

/**
 * The worldwide show's title card when the country changes: the country's travel poster
 * (a placeholder card for one without) beside its name, stamped like a passport entry. The
 * poster is as big as the show's frame allows (17 Nov 2026, the user's wish): on a phone, most
 * of the screen above the name; on wide screens, beside it, as tall as fits.
 */
function SlideTitleCard({ countryCode, first = false }) {
  const [poster] = postersFor(countryCode);
  const name = countryName(countryCode);

  return (
    <div className='grid w-full max-w-6xl content-center items-center justify-items-center gap-4 sm:grid-cols-2'>
      {poster ? (
        <PosterImage
          poster={poster}
          alt={`Travel poster for ${name}`}
          // No cream border: the posters have their own printed one (17 Nov 2026)
          className={`-rotate-2 overflow-hidden shadow-paper ${POSTER_SIZE}`}
        />
      ) : (
        <div className={`-rotate-2 ${POSTER_SIZE}`}>
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
