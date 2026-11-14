import React, { useEffect, useId, useRef } from 'react';

function ConfirmModal({ onClose, onConfirm, header, message }) {
  const titleId = useId();
  const descId = useId();

  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        const list = Array.from(focusables).filter(
          (el) =>
            !el.hasAttribute('disabled') &&
            el.getAttribute('aria-hidden') !== 'true',
        );

        if (!list.length) return;

        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown, true);
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [onClose]);

  return (
    <div className='fixed inset-0 z-50 bg-colour2/90 flex items-center justify-center px-8'>
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={descId}
        className='bg-colour1 grid h-fit gap-y-2 rounded-2xl shadow-lg border-2 border-colour6 w-full max-w-md p-6'
      >
        <div className='grid h-fit gap-y-2'>
          <h2 id={titleId} className='text-xl font-semibold text-colour6'>
            {header}
          </h2>
          <p id={descId} className=''>
            {message}
          </p>
        </div>
        <div className='flex justify-end gap-3'>
          <button
            ref={cancelButtonRef}
            type='button'
            className='px-4 py-2 bg-status-critical rounded text-colour1 hover:brightness-75'
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type='button'
            className='px-4 py-2 bg-colour6 text-colour1 rounded hover:brightness-110'
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
