import React from 'react';

// The "Ad" on every offer card, as a small rubber stamp (UK advertising rules: an ad must
// be obviously an ad). Hidden from screen readers only because the card's link says
// "Ad: …" first, so it isn't heard twice.
function AdStamp({ className = '' }) {
  return (
    <span
      aria-hidden='true'
      className={`grid place-items-center border-2 border-poster-red-deep bg-poster-cream px-1.5 font-travel text-xs uppercase leading-tight tracking-wide text-poster-red-deep shadow-paper ${className}`}
    >
      Ad
    </span>
  );
}

export default AdStamp;
