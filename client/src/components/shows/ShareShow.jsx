import React, { Suspense, lazy, useState } from 'react';
// Icons
import { FaFilm } from 'react-icons/fa';
// Components
import Button from '@/components/common/Button';
import MapActionButton from '@/components/map/MapActionButton';

// The dialog downloads when it's first wanted: pointing at or focusing the button starts it early
const loadDialog = () => import('./ShowMakerDialog');
const ShowMakerDialog = lazy(loadDialog);

/**
 * "Make a slideshow" (25 Nov 2026, "Share a slideshow" until it was saved, 27 Nov 2026;
 * docs/API.md "Photo slideshows"): the button and the
 * dialog it opens (ShowMakerDialog), for a map's editors, in the photo album, a country's
 * ticket and a trip's Photos card. `source` is the list to choose from (the gallery's own
 * filters), `defaultTitle` the show's title to start with. `inMapPanel` for a map panel's
 * button style; `fill` to fill its grid cell, as Print or download does beside it.
 */
function ShareShow({ mapId, source, defaultTitle = '', inMapPanel = false, fill = false }) {
  const [open, setOpen] = useState(false);
  const ButtonKind = inMapPanel ? MapActionButton : Button;

  return (
    <>
      <span
        className={fill ? 'grid' : inMapPanel ? 'grid justify-items-start phone:justify-items-stretch' : 'grid justify-items-start'}
        onPointerEnter={loadDialog}
        onFocus={loadDialog}
      >
        <ButtonKind quiet onClick={() => setOpen(true)}>
          <FaFilm aria-hidden='true' className='self-center text-sm' />
          <span>Make a slideshow</span>
        </ButtonKind>
      </span>
      {open ? (
        <Suspense fallback={null}>
          <ShowMakerDialog mapId={mapId} source={source} defaultTitle={defaultTitle} onClose={() => setOpen(false)} />
        </Suspense>
      ) : null}
    </>
  );
}

export default ShareShow;
