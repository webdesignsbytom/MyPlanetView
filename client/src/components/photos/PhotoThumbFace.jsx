import React from 'react';
// Icons
import { IoEyeOff } from 'react-icons/io5';
import { FaPlay } from 'react-icons/fa';
// Utils
import { formatVideoLength } from '@/utils/photos/videoLength';

// What a photo tile shows (PhotoThumb, and the tiles being rearranged): the thumbnail,
// and marks for a photo hidden from viewers and a landmark suggestion still waiting
// for a yes. A video (First Class) has a play mark and its length ("1:30"); the tile's
// own label says "Video, 1 minute 30 seconds" (photoLabel), so the marks are hidden from
// screen readers. The thumbnail can't be dragged out of the page as an image.
function PhotoThumbFace({ photo }) {
  const waiting = photo.landmarks?.some((l) => !l.confirmed);
  const video = photo.kind === 'VIDEO';
  return (
    <>
      {photo.thumbUrl ? (
        <img src={photo.thumbUrl} alt='' loading='lazy' decoding='async' draggable={false} className='h-full w-full object-cover' />
      ) : null}
      {video ? (
        <>
          <span
            aria-hidden='true'
            className='absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-poster-cream bg-poster-red text-sm text-poster-cream shadow-paper'
          >
            <FaPlay className='translate-x-px' />
          </span>
          {photo.durationS ? (
            <span aria-hidden='true' className='absolute bottom-1 left-1 rounded bg-poster-ink/75 px-1.5 text-2xs font-semibold tabular-nums text-poster-cream'>
              {formatVideoLength(photo.durationS)}
            </span>
          ) : null}
        </>
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
