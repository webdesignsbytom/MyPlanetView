import React, { useMemo } from 'react';
// Hooks
import useMapViewport from '@/hooks/useMapViewport';
// Components
import WorldMap from '@/components/map/WorldMap';
import MapBackground from '@/components/map/MapBackground';
// Utils
import { countryName } from '@/utils/map/countries';
import { mapExtent } from '@/utils/map/projection';
import { isAntarctic } from '@/utils/map/specialPlaces';

// The card's shape is the map's: 2000 wide, 1064 tall with Antarctica, 887 without
// (projection.js mapExtent), so the whole world fills it
const ASPECT = { true: 'aspect-[2000/1064]', false: 'aspect-[2000/887]' };

// The trip on the world map: its countries coloured in, its stops numbered and joined.
// A still overview, so the page scrolls past it normally on a phone. Mounted on a cream
// card in the shared ticket-edge, so the dashed printed line shows on the paper margin
// around the map, like a postcard. Antarctica follows the viewer's setting, but is
// always drawn when the trip stops there.
function TripMiniMap({ trip, styleId = 'animated', showAntarctica = true }) {
  const stops = useMemo(() => trip.stops || [], [trip.stops]);
  const withAntarctica = showAntarctica || stops.some((stop) => isAntarctic(stop.countryCode));
  const extent = useMemo(() => mapExtent(withAntarctica), [withAntarctica]);
  const viewport = useMapViewport({ wheelZoom: false, extent });
  const visitsByCode = useMemo(
    () => Object.fromEntries(stops.map((stop) => [stop.countryCode, trip.status === 'COMPLETED' ? 'VISITED' : 'WANT_TO_GO'])),
    [stops, trip.status],
  );
  const route = stops.map((s) => countryName(s.countryCode)).join(', then ');

  return (
    <div className='ticket-edge grid bg-paper-cream p-3 sm:p-4'>
      <div
        data-map-style={styleId}
        className={`relative ${ASPECT[withAntarctica]} w-full overflow-hidden border-2 border-poster-brown bg-map-sea`}
      >
        <MapBackground styleId={styleId} animatedSea={false} />
        <div className='absolute inset-0'>
          <WorldMap
            viewport={viewport}
            panZoom={false}
            visitsByCode={visitsByCode}
            stops={stops}
            showGrid
            showAntarctica={withAntarctica}
            label={stops.length ? `Route map: ${route}` : `${trip.title}: no stops yet`}
          />
        </div>
      </div>
    </div>
  );
}

export default TripMiniMap;
