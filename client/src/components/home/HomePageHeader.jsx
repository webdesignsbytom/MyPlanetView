import React from 'react';
// Constants
import { ABOUT_PAGE_URL } from '@/utils/constants/routes';
// Data
import { homeHero } from '@/utils/data/homeData';
// Components
import AppLink from '@/components/common/AppLink';
import HomeHeroArtwork from './HomeHeroArtwork';
import HomeStartButton from './HomeStartButton';

// The home hero (17 Nov 2026, the user's artwork): about a screen tall, the art filling it,
// with the round start stamp and "How it works" over its foot and no text over it (the art
// carries the name and the tagline). A portrait phone's box takes the phone art's own
// shape, so the name across it is never cut off at the sides. The h1 is for screen readers
// and search engines only. Inside <main>, so the skip link lands on it. Poster colours are
// fixed artwork, the same in light and dark mode.
function HomePageHeader() {
  return (
    <section
      aria-labelledby='home-heading'
      className='relative grid min-h-[calc(100svh-6rem)] overflow-hidden rounded-lg ticket-edge lg:min-h-[calc(100svh-1rem)] max-md:portrait:aspect-[941/1672] max-md:portrait:min-h-0'
    >
      <h1 id='home-heading' className='sr-only'>
        {homeHero.title}
      </h1>
      <HomeHeroArtwork />

      <div className='relative grid grid-flow-col content-end items-center justify-center gap-4 px-4 pb-8 sm:gap-8 sm:pb-10'>
        <HomeStartButton />
        <AppLink to={`${ABOUT_PAGE_URL}#how-it-works`} label='How it works' className='btn-paper whitespace-nowrap' />
      </div>
    </section>
  );
}

export default HomePageHeader;
