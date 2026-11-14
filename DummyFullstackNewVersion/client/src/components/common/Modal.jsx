import React, { useId } from 'react';
// Icons
import { IoClose } from 'react-icons/io5';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';

// A centred dialog over a dimmed page: focus is trapped inside, Escape closes it.
// `wide` for the photo viewer.
function Modal({ title, onClose, children, wide = false }) {
  const titleId = useId();
  const dialogRef = useModalA11y(onClose);

  return (
    <div
      className='fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-scrim px-4 py-6'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={`grid w-full gap-4 rounded-2xl border border-colour5/30 bg-colour1 p-5 text-colour4 shadow-lift ${
          wide ? 'max-w-4xl' : 'max-w-lg'
        }`}
      >
        <header className='grid grid-cols-rev items-center gap-3'>
          <h2 id={titleId} className='text-lg font-semibold'>
            {title}
          </h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-colour3'
          >
            <IoClose aria-hidden='true' />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export default Modal;
