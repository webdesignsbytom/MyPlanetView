import React, { useId } from 'react';

// A toolbar or zoom button as a round rubber stamp on parchment (like the MENU stamp),
// the same in every map style. `pressed` marks the open panel: that stamp looks pressed
// in and inked, deep poster red with a parchment ring and icon (never white: the user's
// wish, 16 Nov 2026). With a mouse it is 35px across (a fifth
// smaller than the old 44px); on touch screens it stays at 40px, the smallest
// comfortable tap target.
// A click or tap lets go of focus: a stamp left focused gets the keyboard focus ring as
// soon as any key is pressed (even Shift). Enter or Space (`detail` 0) keeps it.
// Also the trip page's move-up / move-down stamps, which use `disabled` at the list's ends.
// `onIntent` runs when it's hovered, focused or pressed, before the click: the map
// toolbar fetches the panel's code then. `description` is read out after the label (the
// statistics stamp's counts), never drawn.
function MapRoundButton({ label, onClick, onIntent, pressed, disabled = false, description, children }) {
  const descriptionId = useId();
  return (
    <button
      type='button'
      onClick={(e) => {
        onClick(e);
        if (e.detail > 0) e.currentTarget.blur();
      }}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      onPointerDown={onIntent}
      disabled={disabled}
      aria-label={label}
      aria-describedby={description ? descriptionId : undefined}
      aria-pressed={pressed === undefined ? undefined : pressed}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-full border-4 border-double text-lg transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100 pointer-fine:h-8.75 pointer-fine:w-8.75 pointer-fine:border-3 pointer-fine:text-base ${
        pressed
          ? 'translate-y-px border-poster-paper bg-poster-red-deep text-poster-paper'
          : '-rotate-6 border-poster-red bg-poster-paper text-poster-red shadow-paper hover:rotate-0'
      }`}
    >
      {children}
      {description ? (
        <span id={descriptionId} hidden>
          {description}
        </span>
      ) : null}
    </button>
  );
}

export default MapRoundButton;
