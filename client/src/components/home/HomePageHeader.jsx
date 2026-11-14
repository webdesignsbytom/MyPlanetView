import React from 'react';
// Constants
import { ABOUT_PAGE_URL } from '@/utils/constants/routes';
// Data
import { homeHero } from '@/utils/data/homeData';
// Components
import AppLink from '@/components/common/AppLink';
import HomeHeroArtwork from './HomeHeroArtwork';
import HomeStartButton from './HomeStartButton';

// my_planet's poster hero: the fifties adventure artwork, "PICTURE YOUR TRAVEL" in the
// travel face with a black outline, the round start stamp and "How it works". Inside
// <main>, so the skip link lands on the page's h1. Poster colours are fixed artwork, the
// same in light and dark mode. On phones the art is busy behind the title, so the title
// sits on a solid paper plate there.
function HomePageHeader() {
  return (
    <section
      aria-labelledby='home-heading'
      className='relative grid min-h-[calc(100svh-6rem)] overflow-hidden rounded-lg ticket-edge lg:min-h-[calc(100svh-1rem)]'
    >
      <HomeHeroArtwork />

      <div className='relative grid content-center justify-items-center gap-6 px-4 py-12 text-center sm:px-8'>
        <div className='grid rounded-lg px-4 py-5 max-sm:paper-aged max-sm:ticket-edge sm:bg-poster-wash sm:px-6 sm:py-4'>
          <h1
            id='home-heading'
            className='-rotate-2 font-travel text-6xl uppercase leading-none tracking-tight text-poster-red text-stroke-poster sm:text-7xl xl:text-8xl'
          >
            {homeHero.title}
          </h1>
        </div>

        <HomeStartButton />

        <AppLink
          to={`${ABOUT_PAGE_URL}#how-it-works`}
          label='How it works'
          className='btn-paper'
        />
      </div>
    </section>
  );
}

export default HomePageHeader;
