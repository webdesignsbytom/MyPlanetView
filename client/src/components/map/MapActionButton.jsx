import React from 'react';
// Utils
import { mapActionClass } from '@/utils/map/mapActionClass';

// A button inside a map panel, in the travel-paperwork style (a compact btn-poster), the
// same in every map style. `quiet` for secondary actions (parchment), `danger` for
// removing things (btn-danger: a delete button's red, white lettering). A long label wraps inside the
// button instead of widening the panel. The classes are utils/map/mapActionClass.js, which a
// link that should look like one uses too.
function MapActionButton({ children, onClick, type = 'button', disabled = false, quiet = false, danger = false, busy = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy ? 'true' : undefined}
      className={mapActionClass({ quiet, danger })}
    >
      {children}
    </button>
  );
}

export default MapActionButton;
