import React from 'react';
import { Link as HeadLink } from 'react-head';
// Images (imported directly: the home page is eager, and the image manifest is not)
import phone480 from '@/assets/images/pages/home/home-hero-v3-phone-480.avif';
import phone720 from '@/assets/images/pages/home/home-hero-v3-phone-720.avif';
import phoneWebp from '@/assets/images/pages/home/home-hero-v3-phone-720.webp';
import tablet600 from '@/assets/images/pages/home/home-hero-v3-tablet-600.avif';
import tablet800 from '@/assets/images/pages/home/home-hero-v3-tablet-800.avif';
import tablet1086 from '@/assets/images/pages/home/home-hero-v3-tablet-1086.avif';
import tabletWebp from '@/assets/images/pages/home/home-hero-v3-tablet-800.webp';
import desktop800 from '@/assets/images/pages/home/home-hero-v3-desktop-800.avif';
import desktop1200 from '@/assets/images/pages/home/home-hero-v3-desktop-1200.avif';
import desktop1672 from '@/assets/images/pages/home/home-hero-v3-desktop-1672.avif';
import desktopWebp from '@/assets/images/pages/home/home-hero-v3-desktop-1200.webp';

// One artwork per screen shape (17 Nov 2026): portrait phones, portrait tablets, and every
// landscape screen. The header is about a screen tall, so the screen's shape is the
// picture's. In the <picture> the first matching source wins (phone, then tablet, then
// desktop); each preload names exactly its own screens, so a screen fetches one image.
const PHONE = '(max-width: 767px) and (orientation: portrait)';
const TABLET = '(max-width: 1279px) and (orientation: portrait)';
const ART = {
  // Phones get at most the 720 copy: the 941 one (the art's own width, 226 KB, the largest
  // paint on any phone at 2× or more) cost 59 KB more for a little sharpness (19 Nov 2026,
  // the user's decision, the audit's C37). Its file stays in assets, unused.
  phone: { avif: `${phone480} 480w, ${phone720} 720w`, webp: phoneWebp, sizes: '100vw', preload: PHONE },
  tablet: {
    avif: `${tablet600} 600w, ${tablet800} 800w, ${tablet1086} 1086w`,
    webp: tabletWebp,
    sizes: '100vw',
    preload: '(min-width: 768px) and (max-width: 1279px) and (orientation: portrait)',
  },
  desktop: {
    avif: `${desktop800} 800w, ${desktop1200} 1200w, ${desktop1672} 1672w`,
    webp: desktopWebp,
    sizes: '(min-width: 1024px) 80vw, 100vw',
    preload: '(orientation: landscape), (min-width: 1280px)',
  },
};

// The fifties adventure artwork filling the home hero (HomePageHeader sizes it: a portrait
// phone's box is the phone art's shape, so it shows whole; elsewhere the art covers a box
// about a screen tall, a tablet's held to the top, where the name is).
// Decorative; it is the page's largest image, so it's preloaded and fetched first.
function HomeHeroArtwork() {
  return (
    <>
      {Object.entries(ART).map(([name, art]) => (
        <HeadLink
          key={name}
          rel='preload'
          as='image'
          imageSrcSet={art.avif}
          imageSizes={art.sizes}
          type='image/avif'
          media={art.preload}
        />
      ))}
      <picture className='absolute inset-0'>
        <source media={PHONE} type='image/avif' srcSet={ART.phone.avif} sizes={ART.phone.sizes} />
        <source media={PHONE} type='image/webp' srcSet={ART.phone.webp} />
        <source media={TABLET} type='image/avif' srcSet={ART.tablet.avif} sizes={ART.tablet.sizes} />
        <source media={TABLET} type='image/webp' srcSet={ART.tablet.webp} />
        <source type='image/avif' srcSet={ART.desktop.avif} sizes={ART.desktop.sizes} />
        <img
          src={ART.desktop.webp}
          alt=''
          width={1672}
          height={941}
          fetchPriority='high'
          decoding='async'
          className='h-full w-full object-cover md:max-xl:portrait:object-top'
        />
      </picture>
    </>
  );
}

export default HomeHeroArtwork;
