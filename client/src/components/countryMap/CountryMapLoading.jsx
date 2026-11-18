import React from 'react';
// Components
import StampLoading from '@/components/map/StampLoading';

/**
 * A country's own map while it loads (its code, then its states and pins): passport stamps
 * pressed all over the sea with the words in the middle, as the world map's loading screen
 * (18 Nov 2026, the user's wish: not a spinner). It fills the map's place on the page, so
 * the toolbar stays usable. Loaded with the map page, as CountryMapView's fallback.
 */
function CountryMapLoading({ name }) {
  return (
    <div data-country-map-loading='' className='absolute inset-0 grid place-items-center overflow-hidden bg-map-sea animate-ocean motion-reduce:animate-none'>
      <StampLoading />
      <div role='status' className='relative z-10 grid justify-items-center px-4 text-center'>
        <span className='font-travel text-3xl uppercase tracking-wide text-poster-cream [text-shadow:0_0_6px_var(--color-map-sea),0_0_14px_var(--color-map-sea),0_0_24px_var(--color-map-sea)] sm:text-4xl'>
          {name ? `Opening ${name}…` : 'Loading…'}
        </span>
      </div>
    </div>
  );
}

export default CountryMapLoading;
