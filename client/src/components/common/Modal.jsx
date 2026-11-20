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
// dialog, closing it.) `fill` (the photo viewer): on phones it takes the map panels' box,
// the whole screen but for 0.75rem all round, as a country's ticket does (17 Nov 2026, the
// user's wish).
function Modal({ title, onClose, children, wide = false, fill = false }) {
  const titleId = useId();
  const dialogRef = useModalA11y(onClose);

  return (
    <div
      className={`fixed inset-0 z-50 grid grid-rows-[minmax(0,1fr)] place-items-center bg-scrim ${fill ? 'p-3 nophone:px-4 nophone:py-6' : 'px-4 py-6'}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={`ticket-edge paper-fields grid max-h-full w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-paper-cream text-colour4 ${wide ? 'max-w-4xl' : 'max-w-lg'} ${fill ? 'phone:h-full' : ''}`}
      >
        <PaperStripHeader titleId={titleId} title={title} onClose={onClose} closeLabel='Close' />
        {/* One column as wide as the body (its scrollbar left out): an implicit column grew to
            its content, and the photo viewer's buttons ran onto the dialog's edge (19 Nov 2026, the audit) */}
        <div className='grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 overflow-y-auto overscroll-contain px-5 pb-6 pt-5 sideways:pb-3 sideways:pt-3'>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
