import React, { useMemo } from 'react';
// Components
import PosterImage from '@/components/map/PosterImage';
import PosterPlaceholder from '@/components/map/PosterPlaceholder';
import LandmarkModelImage from './LandmarkModelImage';
// Utils
import { postersFor } from '@/utils/map/posterData';
import { countryOutline } from '@/utils/map/countryOutline';
import { pastelFill, pastelNumberFor } from '@/utils/map/visitStatus';

/**
 * A country's picture on the celebration screen: its outline as the map draws it, in its own
 * colour (a map design's colour for it too: the `g` carries `data-code`, as on the map), above
 * its little 3D models (`models`, the tallest first: up to three) standing in a row, each as
 * tall as its `size` says, so the Eiffel Tower stands over the Mont-Saint-Michel as on the map
 * (24 Nov 2026, the user's wish: the outline above the models; it was the travel poster behind
 * them). A place with no shape (a micro-state's dot, a pole, Goa) keeps its poster, or the
 * placeholder card. Decorative: the screen names it.
 */
function CountryCelebrationPicture({ code, name, models }) {
  const outline = useMemo(() => countryOutline(code), [code]);
  const [poster] = outline ? [] : postersFor(code);
  const ice = code === 'AQ';
  return (
    <div className='grid h-full w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] place-items-center gap-1'>
      {outline ? (
        <svg
          viewBox={outline.viewBox}
          preserveAspectRatio='xMidYMid meet'
          data-celebration-outline={code}
          className='h-full w-full min-h-0 overflow-visible motion-safe:animate-model-pop'
        >
          <g data-code={code} className={ice ? 'fill-map-ice stroke-map-ice-edge' : `${pastelFill(pastelNumberFor(code))} stroke-map-land-edge`}>
            {outline.paths.map((d, i) => (
              <path key={i} d={d} strokeWidth={1.5} strokeLinejoin='round' vectorEffect='non-scaling-stroke' />
            ))}
          </g>
        </svg>
      ) : (
        <div className='grid h-full min-h-0 -rotate-3 place-items-center motion-safe:animate-model-pop' data-celebration-poster={poster ? poster.name : ''}>
          {poster ? (
            <PosterImage poster={poster} alt='' className='h-full w-auto min-w-0 overflow-hidden shadow-paper' />
          ) : (
            <div className='grid aspect-square h-3/4'>
              <PosterPlaceholder countryName={name} />
            </div>
          )}
        </div>
      )}
      {models.length ? (
        <div className='grid grid-flow-col items-end justify-center gap-1 motion-safe:animate-model-pop'>
          {models.map((model) => (
            <LandmarkModelImage key={model.id} model={model} height={Math.round(4 * model.size * 10) / 10} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default CountryCelebrationPicture;
