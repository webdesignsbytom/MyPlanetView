import React from 'react';
// Media
import { getImageSets } from '@/lib/media/imageManifest';

const DIR = '/src/assets/images/map-styles';

// A card's picture in Settings' map style and map type pickers: the strip cut for cards
// (`preview-<name>-320|640`, from images/src/tools/style-previews.mjs; 26 Nov 2026, the audit:
// the cards loaded the 800 to 949 pixel pictures), AVIF where the browser takes it, the
// 640-wide copy on a sharp screen. A name with no strip falls back to its own set.
function StylePreviewImage({ name, className = '' }) {
  const strip = getImageSets(`preview-${name}`, { dir: DIR });
  const sets = strip.avifSet || strip.webpSet ? strip : getImageSets(name, { dir: DIR });
  const fallback = sets.pick('webp', 320) || sets.pick('jpg', 320) || sets.pick('avif', 320);
  return (
    <picture>
      {sets.avifSet ? <source type='image/avif' srcSet={sets.avifSet} sizes={SIZES} /> : null}
      <img
        src={fallback}
        srcSet={sets.webpSet || undefined}
        sizes={SIZES}
        alt=''
        className={`h-16 w-full object-cover ${className}`}
        loading='lazy'
        // In its own colours on a map shown in Black and white too (index.css, data-mono-map)
        data-keep-colour=''
      />
    </picture>
  );
}

// Two cards a row: about 17rem each in Settings' panel on a wide screen, under half the
// screen on a phone
const SIZES = '(min-width: 640px) 17rem, 45vw';

export default StylePreviewImage;
