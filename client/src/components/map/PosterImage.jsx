import React from 'react';
// Components
import AppImage from '@/components/common/AppImage';
// Data
import { posterUrl } from '@/utils/map/posterData';

// A country poster from the public bucket: the 800px AVIF, or the WebP where a browser
// can't show AVIF. `poster` is an entry from posterData.js.
function PosterImage({ poster, ratio, alt, className, imgClassName }) {
  return (
    <AppImage
      src={posterUrl(poster.name, 'webp')}
      sources={[{ type: 'image/avif', srcSet: posterUrl(poster.name, 'avif') }]}
      ratio={ratio || poster.ratio}
      alt={alt}
      className={className}
      imgClassName={imgClassName}
    />
  );
}

export default PosterImage;
