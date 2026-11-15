import React, { memo } from 'react';
// Components
import PhotoThumbFace from './PhotoThumbFace';
// Utils
import { photoLabel } from '@/utils/photos/photoLabel';

// One photo in a grid: opens the viewer. Marks photos hidden from viewers, and
// landmark suggestions still waiting for a yes (PhotoThumbFace).
function PhotoThumb({ photo, onOpen }) {
  return (
    <button
      type='button'
      onClick={() => onOpen(photo)}
      className='relative grid aspect-square overflow-hidden border-4 border-poster-cream bg-poster-cream shadow-paper focus-visible:outline-2'
      aria-label={`Open ${photoLabel(photo)}`}
    >
      <PhotoThumbFace photo={photo} />
    </button>
  );
}

export default memo(PhotoThumb);
