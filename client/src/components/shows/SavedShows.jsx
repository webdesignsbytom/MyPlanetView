import React, { Suspense, lazy, useState } from 'react';
// Icons
import { FaFilm } from 'react-icons/fa';
// Components
import MapActionButton from '@/components/map/MapActionButton';

// The dialog downloads when it's first wanted: pointing at or focusing the button starts it early
const loadDialog = () => import('./SavedShowsDialog');
const SavedShowsDialog = lazy(loadDialog);

/**
 * "Saved slideshows" (27 Nov 2026, the user's wish: "we need to be able to save slide shows";
 * docs/API.md "Photo slideshows"): the photo album's button for the map's editors, and the
 * dialog it opens (SavedShowsDialog): the map's saved slideshows to play again, share, rename
 * or delete, and how many it keeps on its plan.
 */
function SavedShows({ mapId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span className='grid justify-items-start phone:justify-items-stretch' onPointerEnter={loadDialog} onFocus={loadDialog}>
        <MapActionButton quiet onClick={() => setOpen(true)}>
          <FaFilm aria-hidden='true' className='self-center text-sm' />
          <span>Saved slideshows</span>
        </MapActionButton>
      </span>
      {open ? (
        <Suspense fallback={null}>
          <SavedShowsDialog mapId={mapId} onClose={() => setOpen(false)} />
        </Suspense>
      ) : null}
    </>
  );
}

export default SavedShows;
