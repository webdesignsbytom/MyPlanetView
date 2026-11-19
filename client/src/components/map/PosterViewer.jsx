import React from 'react';
import { createPortal } from 'react-dom';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';
// Components
import CloseStamp from '@/components/common/CloseStamp';
import PosterImage from './PosterImage';

/**
 * A country's travel poster on its own, as big as the screen allows (17 Nov 2026, the user's
 * wish: tap the poster on a country's ticket to see it whole), over a darkened page (two
 * layers of the scrim: 18 Nov 2026, the user's wish, darker). The close stamp, Escape or a
 * tap beside the poster closes it, and focus goes back to the poster's button
 * (useModalA11y). On wide screens the stamp sits in the screen's top right corner and the
 * poster takes the whole height (18 Nov 2026, the user's wish); on phones it's over the
 * poster's corner, in a row of its own. Portalled, so the ticket's own Escape waits (the
 * modal takes it first).
 */
function PosterViewer({ poster, countryName, onClose }) {
  const dialogRef = useModalA11y(onClose);
  const closeOnBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className='fixed inset-0 z-50 grid place-items-center bg-scrim p-4' onClick={closeOnBackdrop}>
      <div aria-hidden='true' className='pointer-events-none absolute inset-0 bg-scrim' />
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-label={`Travel poster for ${countryName}`}
        // As wide as fits: the screen's width, or its height at the poster's own shape (less
        // the close stamp's row on phones)
        style={{ '--poster-ratio': poster.ratio || '2/3' }}
        className='relative grid w-full justify-items-center gap-3'
        onClick={closeOnBackdrop}
      >
        <div className='grid w-full max-w-[min(100%,calc((100svh_-_5.5rem)*var(--poster-ratio)))] justify-items-end nophone:hidden'>
          <CloseStamp label='Close the poster' onClick={onClose} />
        </div>
        <div className='fixed right-4 top-4 z-10 phone:hidden'>
          <CloseStamp label='Close the poster' onClick={onClose} />
        </div>
        <div className='w-full max-w-[min(100%,calc((100svh_-_5.5rem)*var(--poster-ratio)))] nophone:max-w-[min(100%,calc((100svh_-_2rem)*var(--poster-ratio)))]'>
          <PosterImage poster={poster} alt={`Travel poster for ${countryName}`} className='w-full overflow-hidden shadow-paper' />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PosterViewer;
