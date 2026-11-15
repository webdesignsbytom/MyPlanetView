import React from 'react';
// Components
import MapActionButton from './MapActionButton';

// The way into the unplaced photos (no country), from the stats and the country list.
// Shown only while there are some; `more` when there are more than one page holds.
function UnplacedPhotosButton({ count, more = false, onOpen }) {
  if (!count) return null;
  return (
    <div className='grid justify-items-start'>
      {/* One string: the button is a grid, so separate text nodes would sit apart */}
      <MapActionButton quiet onClick={onOpen}>{`Unplaced photos (${count}${more ? '+' : ''})`}</MapActionButton>
    </div>
  );
}

export default UnplacedPhotosButton;
