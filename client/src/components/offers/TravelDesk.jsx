import React, { Suspense, lazy, useState } from 'react';
import { createPortal } from 'react-dom';
// Icons
import { FaPlane } from 'react-icons/fa';
// Components
import Button from '@/components/common/Button';
import MapActionButton from '@/components/map/MapActionButton';

// The desk itself downloads when it's first wanted: pointing at or focusing the button
// starts it early
const loadDialog = () => import('./TravelDeskDialog');
const TravelDeskDialog = lazy(loadDialog);

/**
 * The "Travel Desk" button and the desk it opens (TravelDeskDialog): on trip pages, a
 * map's country panel and the country guides, on every plan, signed in or not. Nothing
 * opens until it's pressed. The desk goes over the whole page (a portal), whatever panel
 * the button sits in. `inMapPanel` for a map panel's button style; `fill` to fill its
 * cell (a row of actions). `onOpen` tells the page it's open (the map then works out where
 * a planned trip goes).
 * The props are TravelDeskDialog's: `countryCodes`, `trip`, `guideOnPage`.
 */
function TravelDesk({ countryCodes, trip = null, guideOnPage = null, inMapPanel = false, fill = false, onOpen }) {
  const [open, setOpen] = useState(false);
  const ButtonKind = inMapPanel ? MapActionButton : Button;

  const show = () => {
    setOpen(true);
    onOpen?.();
  };

  return (
    <>
      <span className={fill ? 'grid' : inMapPanel ? 'grid justify-items-start phone:justify-items-stretch' : 'grid justify-items-start'} onPointerEnter={loadDialog} onFocus={loadDialog}>
        <ButtonKind quiet onClick={show}>
          <FaPlane aria-hidden='true' className='self-center text-sm' />
          <span>Travel Desk</span>
        </ButtonKind>
      </span>
      {open
        ? createPortal(
            <Suspense fallback={null}>
              <TravelDeskDialog countryCodes={countryCodes} trip={trip} guideOnPage={guideOnPage} onClose={() => setOpen(false)} />
            </Suspense>,
            document.body,
          )
        : null}
    </>
  );
}

export default TravelDesk;
