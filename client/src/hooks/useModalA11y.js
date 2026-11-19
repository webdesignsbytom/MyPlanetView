import { useEffect, useRef } from 'react';
// Utils
import { lockBodyScroll } from '@/utils/layout/bodyScrollLock';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The open modals, newest last: only the top one answers Escape and Tab, so a dialog
// opened from inside another (a confirmation over the share dialog) closes on its own
const openModals = [];

/**
 * What every modal needs (from NextDummy): lock the page behind it, focus its first
 * control, keep Tab inside it, close on Escape, and hand focus back on close.
 * Returns the ref for the dialog element.
 */
export default function useModalA11y(onClose, { open = true } = {}) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const token = {};
    openModals.push(token);
    previouslyFocusedRef.current = document.activeElement;

    const releaseScroll = lockBodyScroll();

    const focusables = () =>
      Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) || []).filter(
        (el) => el.getAttribute('aria-hidden') !== 'true',
      );

    focusables()[0]?.focus?.();

    const onKeyDown = (e) => {
      if (openModals[openModals.length - 1] !== token) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const list = focusables();
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
    };

    // Capture phase, so a stray handler inside the dialog cannot swallow Escape.
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      openModals.splice(openModals.indexOf(token), 1);
      releaseScroll();
      document.removeEventListener('keydown', onKeyDown, true);
      // Only to an element still on the page: a dialog closed together with the one it was
      // opened from would hand focus to a button that's gone, after the outer one had given
      // it back to its own opener
      const opener = previouslyFocusedRef.current;
      if (opener?.isConnected) opener.focus?.();
    };
  }, [open]);

  return dialogRef;
}
