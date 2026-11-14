import React from 'react';

// A button inside a map panel, in the map style's colours. `quiet` for secondary actions,
// `danger` for removing things.
function MapActionButton({ children, onClick, type = 'button', disabled = false, quiet = false, danger = false, busy = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy ? 'true' : undefined}
      className={`grid grid-row items-center justify-center gap-2 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? 'border-status-critical text-status-critical tone-danger'
          : quiet
            ? 'border-map-edge/40 bg-transparent text-map-ink'
            : 'border-map-edge bg-map-panel-alt text-map-alt-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default MapActionButton;
