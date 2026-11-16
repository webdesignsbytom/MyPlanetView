import React from 'react';

// Button sizes, through btn-poster / btn-paper's variables. `small` is for actions
// inside a list (a trip stop's Edit and Remove); on touch screens it keeps a 40px target.
const SIZE_DEFAULT = '[--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.375rem] [--btn-size:1.125rem]';
const SIZE_SMALL = '[--btn-leading:1.25rem] [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:1rem] pointer-coarse:[--btn-pad-y:0.5rem]';

// A form or dialog button, in the site's travel-paperwork style: poster red with a brown
// edge (btn-poster); `quiet` is the parchment one (btn-paper); `danger` is parchment
// with deep-red lettering, for removing things. `ariaLabel` names it when the visible
// word alone is ambiguous (one "Edit" per list item); `ref` reaches the <button>.
// `ariaExpanded` for a button that shows and hides something below it.
function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  busy = false,
  quiet = false,
  danger = false,
  small = false,
  ariaLabel,
  ariaExpanded,
  ref,
}) {
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy ? 'true' : undefined}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`grid-row justify-center gap-2 ${small ? SIZE_SMALL : SIZE_DEFAULT} ${
        danger ? 'btn-paper [--btn-ink:var(--poster-red-deep)]' : quiet ? 'btn-paper' : 'btn-poster'
      }`}
    >
      {children}
    </button>
  );
}

export default Button;
