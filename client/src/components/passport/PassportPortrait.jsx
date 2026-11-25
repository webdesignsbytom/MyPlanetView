import React from 'react';
// Utils
import { portraitStyle } from '@/utils/passport/travellerDetails';

const initials = (name) =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

/**
 * A traveller's photo box on their passport page (25 Nov 2026): the photo chosen for it,
 * cropped (its focus and zoom: utils/passport/travellerDetails.js portraitStyle), or their
 * account's picture, else their initials. As tall as the details beside it, never shorter than
 * 3:4. `className` for the box's own size (the crop dialog's preview is bigger).
 */
function PassportPortrait({ name, photo, className = 'min-h-[6.75rem]' }) {
  return (
    <span
      aria-hidden='true'
      data-passport-photo={photo ? photo.source : ''}
      className={`relative grid place-items-center overflow-hidden border-2 border-colour9 bg-colour8/40 font-travel text-3xl text-colour9 ${className}`}
    >
      {photo?.url ? (
        <img src={photo.url} alt='' draggable={false} className='absolute inset-0 h-full w-full object-cover' style={portraitStyle(photo)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export default PassportPortrait;
