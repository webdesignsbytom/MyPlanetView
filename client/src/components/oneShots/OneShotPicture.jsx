import React from 'react';
import { FaBinoculars } from 'react-icons/fa';

/**
 * An item's photo (utils/oneShots/oneShotPhotoInfo.js) filling its box, or a pair of
 * binoculars where it has none (or before the credits load). Decorative: its name is beside it.
 */
function OneShotPicture({ photo, className = '' }) {
  return photo ? (
    <picture className={`block overflow-hidden ${className}`}>
      <source type='image/avif' srcSet={photo.avif} />
      <img
        src={photo.webp}
        alt=''
        width={photo.width}
        height={photo.height}
        loading='lazy'
        decoding='async'
        referrerPolicy='no-referrer'
        className='block h-full w-full object-cover'
      />
    </picture>
  ) : (
    <span aria-hidden='true' className={`grid place-items-center bg-colour9/10 text-colour9/60 ${className}`}>
      <FaBinoculars className='h-8 w-8' />
    </span>
  );
}

export default OneShotPicture;
