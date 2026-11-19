import React, { useEffect, useId, useRef } from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { lockBodyScroll } from '@/utils/layout/bodyScrollLock';

function ConfirmModal({ onClose, onConfirm, header, message }) {
  const titleId = useId();
  const descId = useId();

  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;

    // The page's one counted lock (bodyScrollLock.js), shared with every other dialog
    const releaseScroll = lockBodyScroll();

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
      releaseScroll();
      document.removeEventListener('keydown', onKeyDown, true);
      if (previouslyFocusedRef.current?.isConnected && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [onClose]);

  // Travel paperwork, like components/common/Modal: cream paper in the ticket edge with a
  // parchment title strip, over the dark scrim; Cancel is the quiet parchment button
  return (
    <div className='fixed inset-0 z-50 grid place-items-center-safe overflow-y-auto bg-scrim px-4 py-6'>
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={descId}
        className='ticket-edge grid w-full max-w-md overflow-hidden bg-paper-cream text-colour4'
      >
        <div className='paper-aged border-b-2 border-dashed border-poster-brown px-5 pb-3 pt-4'>
          <h2 id={titleId} className='font-travel text-2xl uppercase leading-tight tracking-wide text-poster-red-deep'>
            {header}
          </h2>
        </div>
        <div className='grid gap-4 px-5 pb-6 pt-5'>
          <p id={descId} className='leading-relaxed'>
            {message}
          </p>
          <div className='grid grid-row justify-end gap-3'>
            <Button ref={cancelButtonRef} quiet onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
