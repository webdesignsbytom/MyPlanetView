import React from 'react';

/**
 * The electronic passport's mark, foil-stamped at the foot of the cover as on a real one:
 * a frame with a circle between two lines. Drawn in the text colour; decoration only.
 */
function PassportChipMark({ className = '' }) {
  return (
    <svg viewBox='0 0 60 40' aria-hidden='true' focusable='false' fill='none' stroke='currentColor' strokeWidth='3' className={className}>
      <rect x='2.5' y='2.5' width='55' height='35' rx='4' />
      <path d='M2.5 14H57.5M2.5 26H57.5' />
      <circle cx='30' cy='20' r='6' />
    </svg>
  );
}

export default PassportChipMark;
