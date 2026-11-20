// The page behind an open dialog doesn't scroll. One lock for every dialog, counted: the first
// to open saves the body's overflow and the last to close puts it back. Each dialog keeping
// its own copy went wrong when two closed together (the share dialog and its "Make owner"
// confirmation): React ran the outer one's clean-up first, then the inner one put back the
// `hidden` it had seen, and the page stayed unscrollable until a reload (19 Nov 2026, the audit).

let locks = 0;
let saved = '';

/** Lock the page's scrolling; returns the function that releases this lock. */
export function lockBodyScroll() {
  if (locks === 0) {
    saved = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) document.body.style.overflow = saved;
  };
}
