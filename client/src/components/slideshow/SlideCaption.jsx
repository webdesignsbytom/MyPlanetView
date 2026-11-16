import React from 'react';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';
import { photoPlace } from '@/utils/photos/slideshow';

/**
 * Under the photo: its place and landmarks, the day it was taken, and its own caption.
 * A title card names its country; the end card says how many photos there were.
 */
function SlideCaption({ slide, photoCount }) {
  if (!slide) return <p className='text-sm'>&nbsp;</p>;
  if (slide.type === 'card') {
    return <p className='font-travel text-lg uppercase tracking-wide'>{countryName(slide.countryCode)}</p>;
  }
  if (slide.type === 'end') {
    return (
      <p className='text-sm font-medium'>
        That’s all {photoCount} {photoCount === 1 ? 'photo' : 'photos'}.
      </p>
    );
  }
  const { photo } = slide;
  const place = photoPlace(photo);
  return (
    <div className='grid gap-0.5'>
      <p className='grid grid-row-wrap gap-x-3 text-sm'>
        {place ? <span className='font-semibold'>{place}</span> : <span className='font-semibold'>Somewhere unplaced</span>}
        {photo.takenAt ? <span>{formatDay(photo.takenAt)}</span> : null}
        {photo.hidden ? <span className='text-poster-red-deep'>Hidden from viewers</span> : null}
      </p>
      {photo.caption ? <p className='text-sm italic'>{photo.caption}</p> : null}
    </div>
  );
}

export default SlideCaption;
