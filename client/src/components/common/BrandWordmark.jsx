import React from 'react';
// Images (imported directly, so the navbar doesn't pull in the whole image manifest)
import logoAvif240 from '@/assets/images/brand/logo-240.avif';
import logoAvif480 from '@/assets/images/brand/logo-480.avif';
import logoWebp240 from '@/assets/images/brand/logo-240.webp';
import logoWebp480 from '@/assets/images/brand/logo-480.webp';

// Widths (the logo is 3:2) and the matching `sizes`
const SIZES = {
  md: { box: 'w-28', sizes: '7rem' },
  lg: { box: 'w-48', sizes: '12rem' },
  xl: { box: 'w-full max-w-48', sizes: '12rem' },
};

// The My Planet View logo (made by images/src/tools/brand-assets.mjs): the traveller, the
// globe and the name on its red banner, so no name is set beside it. It's decorative here:
// what holds it names it (the nav's home links say "<name> homepage", the footer has its
// own heading). size: 'md' (the navbar), 'lg' (the footer), 'xl' (the nav column, as wide
// as the column allows).
function BrandWordmark({ size = 'md' }) {
  const { box, sizes } = SIZES[size];
  return (
    <picture className={`grid ${box}`}>
      <source type='image/avif' srcSet={`${logoAvif240} 240w, ${logoAvif480} 480w`} sizes={sizes} />
      <source type='image/webp' srcSet={`${logoWebp240} 240w, ${logoWebp480} 480w`} sizes={sizes} />
      <img src={logoWebp480} alt='' width={480} height={320} decoding='async' className='aspect-[3/2] h-auto w-full object-contain' />
    </picture>
  );
}

export default BrandWordmark;
