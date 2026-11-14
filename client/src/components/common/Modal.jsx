import React, { useId } from 'react';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';
// Components
import PaperStripHeader from './PaperStripHeader';

// A centred dialog over a dimmed page, as travel paperwork (the map panels' look): cream
// paper in the ticket edge, a parchment title strip and a round close stamp. Focus is
// trapped inside, Escape closes it. `wide` for the photo viewer. A dialog taller than
// the screen starts at the top (safe centring), so its title and close stamp stay reachable.
function Modal({ title, onClose, children, wide = false }) {
  const titleId = useId();
  const dialogRef = useModalA11y(onClose);

  return (
    <div
      className='fixed inset-0 z-50 grid place-items-center-safe overflow-y-auto bg-scrim px-4 py-6'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={`ticket-edge paper-fields grid w-full overflow-hidden bg-paper-cream text-colour4 ${wide ? 'max-w-4xl' : 'max-w-lg'}`}
      >
        <PaperStripHeader titleId={titleId} title={title} onClose={onClose} closeLabel='Close' />
        <div className='grid min-w-0 gap-4 px-5 pb-6 pt-5'>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
