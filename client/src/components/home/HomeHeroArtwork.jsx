import React from 'react';
import { Link as HeadLink } from 'react-head';
// Images (imported directly: the home page is eager, and the image manifest is not)
import heroAvif800 from '@/assets/images/pages/home/home-hero-800.avif';
import heroAvif1200 from '@/assets/images/pages/home/home-hero-1200.avif';
import heroAvif1792 from '@/assets/images/pages/home/home-hero-1792.avif';
import heroWebp1200 from '@/assets/images/pages/home/home-hero-1200.webp';

const AVIF_SET = `${heroAvif800} 800w, ${heroAvif1200} 1200w, ${heroAvif1792} 1792w`;
const SIZES = '(min-width: 1024px) 80vw, 100vw';

// my_planet's fifties adventure artwork behind the home hero. Decorative; it is the
// page's largest image, so it's preloaded and fetched first.
function HomeHeroArtwork() {
  return (
    <>
      <HeadLink rel='preload' as='image' imageSrcSet={AVIF_SET} imageSizes={SIZES} type='image/avif' />
      <picture className='absolute inset-0'>
        <source type='image/avif' srcSet={AVIF_SET} sizes={SIZES} />
        <img
          src={heroWebp1200}
          alt=''
          width={1792}
          height={1024}
          fetchPriority='high'
          decoding='async'
          className='h-full w-full object-cover'
        />
      </picture>
    </>
  );
}

export default HomeHeroArtwork;
