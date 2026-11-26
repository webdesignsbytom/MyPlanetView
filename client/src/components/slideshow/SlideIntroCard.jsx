import React from 'react';

/**
 * A shared slideshow's opening card (25 Nov 2026; docs/API.md "Photo slideshows"): its title,
 * stamped like the end card's "The end", over "A slideshow" and how many photos it has.
 */
function SlideIntroCard({ title, photoCount = null }) {
  return (
    <div className='grid max-w-3xl justify-items-center gap-4 p-1 text-center'>
      <p className='font-travel text-sm uppercase tracking-xl text-poster-brown'>A slideshow</p>
      <p className='-rotate-2 border-4 border-double border-poster-red px-4 py-2 font-travel text-4xl uppercase leading-none text-poster-red text-stroke-poster sm:text-6xl'>
        {title}
      </p>
      {photoCount ? (
        <p className='font-travel text-lg uppercase tracking-wide text-poster-brown'>
          {photoCount.toLocaleString('en-GB')} {photoCount === 1 ? 'photo' : 'photos'}
        </p>
      ) : null}
    </div>
  );
}

export default SlideIntroCard;
