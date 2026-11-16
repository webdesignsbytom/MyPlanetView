import React from 'react';

// A button inside a map panel, in the travel-paperwork style (a compact btn-poster), the
// same in every map style. `quiet` for secondary actions (parchment), `danger` for
// removing things (parchment with deep-red lettering). A long label ("Add photos from
// Saint Vincent and the Grenadines") wraps inside the button instead of widening the panel.
function MapActionButton({ children, onClick, type = 'button', disabled = false, quiet = false, danger = false, busy = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy ? 'true' : undefined}
      className={`grid-flow-col justify-center gap-2 text-center [grid-auto-columns:minmax(0,max-content)] [--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.25rem] [--btn-size:1.0625rem] ${
        danger ? 'btn-paper [--btn-ink:var(--poster-red-deep)]' : quiet ? 'btn-paper' : 'btn-poster'
      }`}
    >
      {children}
    </button>
  );
}

export default MapActionButton;
