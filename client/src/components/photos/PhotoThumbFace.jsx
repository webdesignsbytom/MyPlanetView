import React from 'react';
// Icons
import { IoEyeOff } from 'react-icons/io5';

// What a photo tile shows (PhotoThumb, and the tiles being rearranged): the thumbnail,
// and marks for a photo hidden from viewers and a landmark suggestion still waiting
// for a yes. The thumbnail can't be dragged out of the page as an image.
function PhotoThumbFace({ photo }) {
  const waiting = photo.landmarks?.some((l) => !l.confirmed);
  return (
    <>
      {photo.thumbUrl ? (
        <img src={photo.thumbUrl} alt='' loading='lazy' decoding='async' draggable={false} className='h-full w-full object-cover' />
      ) : null}
      {photo.hidden ? (
        <span className='absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-colour1 text-colour4' title='Hidden from viewers'>
          <IoEyeOff aria-hidden='true' />
          <span className='sr-only'>Hidden from viewers</span>
        </span>
      ) : null}
      {waiting ? (
        <span className='absolute bottom-1 right-1 rounded-full bg-colour1 px-2 text-2xs font-medium text-colour6'>
          Landmark?
        </span>
      ) : null}
    </>
  );
}

export default PhotoThumbFace;
