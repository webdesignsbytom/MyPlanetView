import React from 'react';

// The old map's round, outlined buttons (toolbar and zoom). `pressed` marks the open panel.
function MapRoundButton({ label, onClick, pressed, children }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      title={label}
      className={`grid h-11 w-11 place-items-center rounded-full border-2 border-map-edge text-xl text-map-alt-ink shadow-lift-sm transition hover:brightness-110 active:scale-95 ${
        pressed ? 'bg-map-panel-alt' : 'bg-map-button'
      }`}
    >
      {children}
    </button>
  );
}

export default MapRoundButton;
