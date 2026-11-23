import React from 'react';
// Components
import PosterImage from '@/components/map/PosterImage';
import PosterPlaceholder from '@/components/map/PosterPlaceholder';
import LandmarkModelImage from './LandmarkModelImage';
// Utils
import { postersFor } from '@/utils/map/posterData';

/**
 * A country's picture on the celebration screen: its travel poster (the placeholder card
 * without one), tilted, with its little 3D models (`models`, the tallest first: up to three)
 * standing in a row in front of its foot, each as tall as its `size` says, so the Eiffel
 * Tower stands over the Mont-Saint-Michel as on the map. Decorative: the screen names it.
 */
function CountryCelebrationPicture({ code, name, models }) {
  const [poster] = postersFor(code);
  return (
    <div className='grid h-full w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center [grid-template-areas:"stack"]'>
      {/* As tall as the picture, as wide as that makes it (the poster's own shape) */}
      <div className='grid h-full min-h-0 -rotate-3 place-items-center [grid-area:stack] motion-safe:animate-model-pop' data-celebration-poster={poster ? poster.name : ''}>
        {poster ? (
          <PosterImage poster={poster} alt='' className='h-full w-auto min-w-0 overflow-hidden shadow-paper' />
        ) : (
          <div className='grid aspect-square h-3/4'>
            <PosterPlaceholder countryName={name} />
          </div>
        )}
      </div>
      {models.length ? (
        <div className='grid grid-flow-col items-end justify-center gap-1 self-end [grid-area:stack] motion-safe:animate-model-pop'>
          {models.map((model) => (
            <LandmarkModelImage key={model.id} model={model} height={Math.round(5 * model.size * 10) / 10} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default CountryCelebrationPicture;
