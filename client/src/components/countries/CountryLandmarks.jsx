import React from 'react';
// Icons
import { FaCamera } from 'react-icons/fa6';
// Components
import PaperCard from '@/components/common/PaperCard';

// 800 -> "800 m", 20000 -> "20 km"
const distance = (metres) => (metres >= 1000 ? `${Math.round(metres / 100) / 10} km` : `${metres} m`);

/**
 * The country's landmarks (the Landmark table's, copied into the build as
 * content/countries/landmarks.generated.js), each a passport-style stamp on poster paper
 * (the same in both themes), with what the map does with it: a photo taken near it gets
 * the landmark suggested.
 */
function CountryLandmarks({ named, landmarks }) {
  if (!landmarks.length) return null;

  return (
    <PaperCard title={`Landmarks in ${named}`} titleId='country-landmarks-heading'>
      <ul className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {landmarks.map((landmark) => (
          <li
            key={landmark.wikidataId}
            className='grid content-start gap-2 rounded-lg border-4 border-double border-poster-red bg-poster-paper px-5 py-4 text-poster-ink'
          >
            <p className='font-travel text-xs uppercase tracking-xl text-poster-red'>{landmark.category}</p>
            <h3 className='-rotate-1 font-travel text-2xl uppercase leading-tight tracking-wide text-poster-red-deep'>{landmark.name}</h3>
            <p className='grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 text-sm leading-relaxed'>
              <FaCamera aria-hidden='true' className='translate-y-1 text-poster-brown' />
              <span>
                Add a photo taken within {distance(landmark.matchRadiusM)} of it, with its location saved, and your map
                suggests this landmark for it.
              </span>
            </p>
          </li>
        ))}
      </ul>
    </PaperCard>
  );
}

export default CountryLandmarks;
