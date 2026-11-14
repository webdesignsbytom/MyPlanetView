import React from 'react';

// The phone menu's toggle, styled as a rubber stamp to match the boarding pass's
// "Admit one": a round parchment disc with a double red ring and the word in the travel
// face, tilted like a stamp; it straightens when pressed. Reads MENU, or CLOSE while the
// menu is open.
function MenuStampButton({ open, onClick, controls }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={open}
      aria-controls={controls}
      className={`grid h-14 w-14 place-items-center justify-self-end rounded-full border-4 border-double border-poster-red bg-poster-paper font-travel text-sm uppercase leading-none tracking-wide text-poster-red shadow-paper transition hover:brightness-105 active:scale-95 ${
        open ? 'rotate-0' : '-rotate-12'
      }`}
    >
      <span aria-hidden='true'>{open ? 'Close' : 'Menu'}</span>
    </button>
  );
}

export default MenuStampButton;
