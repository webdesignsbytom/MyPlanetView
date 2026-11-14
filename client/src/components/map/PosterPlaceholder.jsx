import React from 'react';
// Icons
import { FaPlane } from 'react-icons/fa6';

// A country with no travel poster yet: its name on poster paper, in the travel face,
// so the card still looks like part of the set (never another country's poster).
function PosterPlaceholder({ countryName, compact = false }) {
  return (
    <div
      role='img'
      aria-label={`${countryName}: travel poster coming soon`}
      className={`grid aspect-square w-full grid-cols-1 content-center justify-items-center gap-2 rounded-lg border-4 border-double border-poster-brown bg-poster-paper p-4 text-center text-poster-ink ${
        compact ? 'gap-1 p-3' : ''
      }`}
    >
      <FaPlane aria-hidden='true' className={`-rotate-12 text-poster-red ${compact ? 'text-xl' : 'text-3xl'}`} />
      {/* Wraps inside the card rather than pushing it wider (narrow phones, long names) */}
      <span className={`max-w-full font-travel leading-none tracking-wide [overflow-wrap:anywhere] ${compact ? 'text-2xl' : 'text-4xl'}`}>
        {countryName}
      </span>
      <span className='text-2xs uppercase tracking-xl'>Poster coming soon</span>
    </div>
  );
}

export default PosterPlaceholder;
