import React from 'react';
import { createPortal } from 'react-dom';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';
// Components
import CloseStamp from '@/components/common/CloseStamp';
import PosterImage from './PosterImage';

/**
 * A country's travel poster on its own, as big as the screen allows (17 Nov 2026, the user's
 * wish: tap the poster on a country's ticket to see it whole), over a dimmed page. The close
 * stamp, Escape or a tap beside the poster closes it, and focus goes back to the poster's
 * button (useModalA11y). Portalled, so the ticket's own Escape waits (the modal takes it first).
 */
function PosterViewer({ poster, countryName, onClose }) {
  const dialogRef = useModalA11y(onClose);
  // As wide as fits: the screen's width, or its height (less the close stamp's row) at the
  // poster's own shape
  const width = `min(100%, calc((100svh - 5.5rem) * ${poster.ratio || '2/3'}))`;

  return createPortal(
    <div
      className='fixed inset-0 z-50 grid place-items-center bg-scrim p-4'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-label={`Travel poster for ${countryName}`}
        className='grid w-full justify-items-center gap-3'
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className='grid w-full justify-items-end' style={{ maxWidth: width }}>
          <CloseStamp label='Close the poster' onClick={onClose} />
        </div>
        <div className='w-full' style={{ maxWidth: width }}>
          <PosterImage poster={poster} alt={`Travel poster for ${countryName}`} className='w-full overflow-hidden shadow-paper' />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PosterViewer;
