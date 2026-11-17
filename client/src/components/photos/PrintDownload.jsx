import React, { Suspense, lazy, useState } from 'react';
import { createPortal } from 'react-dom';
// Icons
import { FaDownload } from 'react-icons/fa';
// Components
import Button from '@/components/common/Button';
import MapActionButton from '@/components/map/MapActionButton';

// The dialog (and the zip library it loads) downloads when it's first wanted: pointing at
// or focusing the button starts it early
const loadDialog = () => import('./PrintDownloadDialog');
const PrintDownloadDialog = lazy(loadDialog);

/**
 * "Print or download" (docs/API.md, "Downloads"): the button and the dialog it opens
 * (PrintDownloadDialog), for a map's or a trip's editors. The dialog goes over the whole
 * page (a portal), whatever panel the button sits in. `scope` is what to download:
 * `{ mapId }` (the whole map, in a folder per country), `{ mapId, country }` or
 * `{ tripId }`; `title` names the zip. `inMapPanel` for a map panel's button style.
 */
function PrintDownload({ scope, title, byCountry = false, inMapPanel = false, fill = false, label = 'Print or download' }) {
  const [open, setOpen] = useState(false);
  const ButtonKind = inMapPanel ? MapActionButton : Button;

  return (
    <>
      <span className={fill ? 'grid' : inMapPanel ? 'grid justify-items-start phone:justify-items-stretch' : 'grid justify-items-start'} onPointerEnter={loadDialog} onFocus={loadDialog}>
        <ButtonKind quiet onClick={() => setOpen(true)}>
          <FaDownload aria-hidden='true' className='self-center text-sm' />
          <span>{label}</span>
        </ButtonKind>
      </span>
      {open
        ? createPortal(
            <Suspense fallback={null}>
              <PrintDownloadDialog scope={scope} title={title} byCountry={byCountry} onClose={() => setOpen(false)} />
            </Suspense>,
            document.body,
          )
        : null}
    </>
  );
}

export default PrintDownload;
