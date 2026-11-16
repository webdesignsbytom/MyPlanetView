import React, { useId } from 'react';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';
// Components
import PaperStripHeader from './PaperStripHeader';

// A centred dialog over a dimmed page, as travel paperwork (the map panels' look): cream
// paper in the ticket edge, a parchment title strip and a round close stamp. Focus is
// trapped inside, Escape closes it, and a press on the dimmed page outside closes it. `wide`
// for the photo viewer and the Travel Desk. It's never taller than the screen: the title
// strip and its close stamp stay put and the body scrolls inside the dialog. (The dimmed
// page used to scroll instead, and a press on its scrollbar counted as one outside the
// dialog, closing it.)
function Modal({ title, onClose, children, wide = false }) {
  const titleId = useId();
  const dialogRef = useModalA11y(onClose);

  return (
    <div
      className='fixed inset-0 z-50 grid grid-rows-[minmax(0,1fr)] place-items-center bg-scrim px-4 py-6'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={`ticket-edge paper-fields grid max-h-full w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-paper-cream text-colour4 ${wide ? 'max-w-4xl' : 'max-w-lg'}`}
      >
        <PaperStripHeader titleId={titleId} title={title} onClose={onClose} closeLabel='Close' />
        <div className='grid min-h-0 min-w-0 content-start gap-4 overflow-y-auto overscroll-contain px-5 pb-6 pt-5'>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
