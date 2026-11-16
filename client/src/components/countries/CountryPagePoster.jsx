import React from 'react';
// Data
import { postersFor, posterUrl } from '@/utils/map/posterData';
// Components
import AppImage from '@/components/common/AppImage';
import PosterPlaceholder from '@/components/map/PosterPlaceholder';

// The country's travel poster at the top of its page, loaded first (it's the largest thing
// on screen), or the "poster coming soon" card for a country without one
function CountryPagePoster({ code, name }) {
  const [poster] = postersFor(code);
  if (!poster) return <PosterPlaceholder countryName={name} />;

  return (
    <AppImage
      src={posterUrl(poster.name, 'webp')}
      sources={[{ type: 'image/avif', srcSet: posterUrl(poster.name, 'avif') }]}
      ratio={poster.ratio}
      alt={`Travel poster of ${name}`}
      priority
      className='ticket-edge overflow-hidden rounded-lg'
    />
  );
}

export default CountryPagePoster;
