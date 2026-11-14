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
// travel face with a black outline, the welcome strip, and the round start button.
// Inside <main>, so the skip link lands on the page's h1. Poster colours are fixed
// artwork, the same in light and dark mode. On phones the art is busy behind small
// text, so the title sits on a solid paper plate and only the title, the start stamp
// and "How it works" show; the welcome strip and the paragraph appear from sm up (they
// stay in the HTML for search engines and screen readers).
function HomePageHeader() {
  return (
    <section
      aria-labelledby='home-heading'
      aria-describedby='home-subheading'
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

        <p className='hidden bg-poster-cream px-4 py-1 font-travel text-xl text-poster-ink shadow-lift-sm sm:grid sm:text-2xl'>
          {homeHero.welcome}
        </p>

        <p
          id='home-subheading'
          className='hidden max-w-xl rounded-lg bg-poster-wash px-4 py-2 text-base leading-relaxed text-poster-ink sm:block sm:text-lg'
        >
          {homeHero.text}
        </p>

        <HomeStartButton />

        <AppLink
          to={`${ABOUT_PAGE_URL}#how-it-works`}
          label='How it works'
          className='rounded-full border-2 border-poster-brown bg-poster-cream px-5 py-2 font-semibold text-poster-ink shadow-lift-sm transition hover:brightness-95'
        />
      </div>
    </section>
  );
}

export default HomePageHeader;
