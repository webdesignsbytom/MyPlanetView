import React, { useMemo } from 'react';
// Hooks
import useMapViewport from '@/hooks/useMapViewport';
// Components
import WorldMap from '@/components/map/WorldMap';
import MapBackground from '@/components/map/MapBackground';
// Utils
import { countryName } from '@/utils/map/countries';

// The trip on the world map: its countries coloured in, its stops numbered and joined.
// A still overview, so the page scrolls past it normally on a phone.
function TripMiniMap({ trip, styleId = 'animated' }) {
  const viewport = useMapViewport({ wheelZoom: false });
  const visitsByCode = useMemo(
    () =>
      Object.fromEntries(
        (trip.stops || []).map((stop) => [stop.countryCode, trip.status === 'COMPLETED' ? 'VISITED' : 'WANT_TO_GO']),
      ),
    [trip.stops, trip.status],
  );
  const stops = trip.stops || [];
  const route = stops.map((s) => countryName(s.countryCode)).join(', then ');

  return (
    <section data-map-style={styleId} className='relative aspect-[2000/857] w-full overflow-hidden rounded-xl border-2 border-map-edge bg-map-sea'>
      <MapBackground styleId={styleId} animatedSea={false} />
      <div className='absolute inset-0'>
        <WorldMap
          viewport={viewport}
          panZoom={false}
          visitsByCode={visitsByCode}
          stops={stops}
          showGrid
          label={stops.length ? `Route map: ${route}` : `${trip.title}: no stops yet`}
        />
      </div>
    </section>
  );
}

export default TripMiniMap;
