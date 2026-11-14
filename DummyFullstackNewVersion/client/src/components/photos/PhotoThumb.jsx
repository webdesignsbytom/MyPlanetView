import React, { memo } from 'react';
// Icons
import { IoEyeOff } from 'react-icons/io5';
// Utils
import { formatDay } from '@/utils/functions/dates';

// One photo in a grid: opens the viewer. Marks photos hidden from viewers, and
// landmark suggestions still waiting for a yes.
function PhotoThumb({ photo, onOpen }) {
  const label = photo.caption || (photo.takenAt ? `Photo from ${formatDay(photo.takenAt)}` : 'Photo');
  const waiting = photo.landmarks?.some((l) => !l.confirmed);
  return (
    <button
      type='button'
      onClick={() => onOpen(photo)}
      className='relative grid aspect-square overflow-hidden rounded-lg border border-colour5/30 bg-colour3 focus-visible:outline-2'
      aria-label={`Open ${label}`}
    >
      {photo.thumbUrl ? (
        <img src={photo.thumbUrl} alt='' loading='lazy' decoding='async' className='h-full w-full object-cover' />
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
    </button>
  );
}

export default memo(PhotoThumb);
