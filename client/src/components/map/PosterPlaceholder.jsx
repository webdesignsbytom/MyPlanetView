import React from 'react';
// Icons
import { FaPlane } from 'react-icons/fa6';

// A country with no travel poster yet: its name on poster paper, in the travel face,
// so the card still looks like part of the set (never another country's poster).
// min-w-0: a square's automatic minimum width follows its content's height, so a long
// name ("Magnetic South Pole") would otherwise widen the whole panel.
// `compact` (the country ticket's stub): on a phone the stub is 6.5rem wide, so the name is
// smaller there, with less padding round it, and breaks only between words, never mid-word
// at any letter ("NOR / TH / POL / E" did). Its size steps down with its longest word, so
// that word fits whole (about 66px across): 14px up to 9 letters, 12px up to 11, else 10px
// (13 letters, "Liechtenstein"); a hyphen, where the browser has a dictionary, then a break
// are left for anything longer.
const compactPhoneSize = (name) => {
  const longest = Math.max(...String(name).split(/\s+/).map((word) => word.length));
  return longest <= 9 ? 'text-sm' : longest <= 11 ? 'text-xs' : 'text-[0.625rem]';
};

function PosterPlaceholder({ countryName, compact = false }) {
  return (
    <div
      role='img'
      aria-label={`${countryName}: travel poster coming soon`}
      className={`grid aspect-square w-full min-w-0 grid-cols-1 content-center justify-items-center rounded-lg border-4 border-double border-poster-brown bg-poster-paper text-center text-poster-ink ${
        compact ? 'gap-1 p-1.5 md:p-3' : 'gap-2 p-4'
      }`}
    >
      <FaPlane aria-hidden='true' className={`-rotate-12 text-poster-red ${compact ? 'text-base md:text-xl' : 'text-3xl'}`} />
      {/* Wraps inside the card rather than pushing it wider (narrow phones, long names):
          between words, hyphenated inside a word too long for the line */}
      <span
        lang='en'
        className={`max-w-full font-travel leading-none hyphens-auto break-words ${
          compact ? `${compactPhoneSize(countryName)} md:text-2xl md:tracking-wide` : 'text-4xl tracking-wide'
        }`}
      >
        {countryName}
      </span>
      <span className='text-2xs uppercase tracking-xl'>Poster coming soon</span>
    </div>
  );
}

export default PosterPlaceholder;
