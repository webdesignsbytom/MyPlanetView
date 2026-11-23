import React, { useMemo } from 'react';
// Hooks
import useMapViewport from '@/hooks/useMapViewport';
import { SplitUkProvider } from '@/hooks/useSplitUk';
// Components
import WorldMap from '@/components/map/WorldMap';
import MapBackground from '@/components/map/MapBackground';
import MapZoomControls from '@/components/map/MapZoomControls';
// Utils
import { mapExtent } from '@/utils/map/projection';

const NO_VISITS = {};

/**
 * The world map a player guesses on ("Guess where I was"), in faded land: a press on a place
 * chooses it (`onChoose(code)`, coloured in), dragged or zoomed with a finger, a drag or the zoom
 * stamps (the wheel is left to the page). Once answered (`answerCode`), only the right place is
 * coloured in and nothing more can be chosen. Places as the game's map draws them (`splitUk`).
 */
function GuessMap({ chosenCode, answerCode = null, onChoose, splitUk = false, label }) {
  const extent = useMemo(() => mapExtent(true), []);
  const viewport = useMapViewport({ extent, wheelZoom: false });
  // In full colour: the place chosen while choosing, then the answer alone
  const shown = answerCode || chosenCode;
  const visitsByCode = useMemo(() => (shown ? { [shown]: 'VISITED' } : NO_VISITS), [shown]);
  return (
    <SplitUkProvider value={splitUk}>
      <div data-map-style='animated' className='relative aspect-[2000/1037.2] w-full overflow-hidden border-2 border-poster-brown bg-map-sea' data-guess-map>
        <MapBackground styleId='animated' animatedSea={false} />
        <div className='absolute inset-0'>
          <WorldMap
            viewport={viewport}
            seaDepths
            visitsByCode={visitsByCode}
            selectedCode={chosenCode}
            // Plain land, so the place chosen and the answer stand out
            showUnvisited={false}
            onSelectCountry={answerCode ? undefined : onChoose}
            showGrid
            label={label}
          />
        </div>
        <div className='pointer-events-none absolute bottom-2 right-2 grid'>
          <div className='pointer-events-auto [zoom:0.85]'>
            <MapZoomControls viewport={viewport} />
          </div>
        </div>
      </div>
    </SplitUkProvider>
  );
}

export default GuessMap;
