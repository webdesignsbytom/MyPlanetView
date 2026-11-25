import React from 'react';
// Utils
import { SIGNATURE_HEIGHT, SIGNATURE_WIDTH } from '@/utils/passport/travellerDetails';

/**
 * A traveller's signature on their passport page (25 Nov 2026): the one they drew (an SVG path
 * in a 300 × 100 box), else their name in a handwriting face. Screen readers hear who signed.
 */
function PassportSignature({ name, signature, className = 'h-12' }) {
  if (signature) {
    return (
      <svg
        role='img'
        aria-label={`${name}’s signature`}
        viewBox={`0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}`}
        data-signature='drawn'
        className={`w-auto max-w-full text-colour4 ${className}`}
      >
        <path d={signature} fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    );
  }
  return (
    <span data-signature='name' className='block truncate font-signature text-2xl leading-tight text-colour4'>
      {name}
    </span>
  );
}

export default PassportSignature;
