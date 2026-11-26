import React, { lazy, useState } from 'react';
// Icons
import { FaStamp } from 'react-icons/fa';
// Components
import MapActionButton from '@/components/map/MapActionButton';
import MapOverlayBoundary from '@/components/map/MapOverlayBoundary';

// The dialog downloads when it's first wanted: pointing at or focusing the button starts it early
const loadDialog = () => import('./PostcardMakerDialog');
const PostcardMakerDialog = lazy(loadDialog);

/**
 * "Send a postcard" (26 Nov 2026, the user's wish: "a send postcard button on each country's
 * popup container on the map"; docs/API.md "Postcards"): the button on a place's ticket and the
 * dialog it opens, for the map's editors with a verified email (a card is theirs, sent from the
 * place: never part of the map). `photoFilters` are the place's photo list's, for a card from one
 * of them.
 */
function SendPostcard({ countryCode, placeName, photoFilters = null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span className='grid' onPointerEnter={loadDialog} onFocus={loadDialog}>
        <MapActionButton quiet onClick={() => setOpen(true)}>
          <FaStamp aria-hidden='true' className='self-center text-sm' />
          <span>Send a postcard</span>
        </MapActionButton>
      </span>
      {open ? (
        <MapOverlayBoundary onClose={() => setOpen(false)}>
          <PostcardMakerDialog countryCode={countryCode} placeName={placeName} photoFilters={photoFilters} onClose={() => setOpen(false)} />
        </MapOverlayBoundary>
      ) : null}
    </>
  );
}

export default SendPostcard;
