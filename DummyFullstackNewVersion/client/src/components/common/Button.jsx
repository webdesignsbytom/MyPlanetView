import React from 'react';

// A button on the page's own colours (outside the map): primary in the brand green,
// `quiet` outlined, `danger` for removing things.
function Button({ children, onClick, type = 'button', disabled = false, busy = false, quiet = false, danger = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy ? 'true' : undefined}
      className={`grid grid-row items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? 'tone-danger hover:brightness-95'
          : quiet
            ? 'border-colour5/40 bg-transparent text-colour4 hover:bg-colour3'
            : 'border-colour6 bg-colour6 text-colour1 hover:brightness-110'
      }`}
    >
      {children}
    </button>
  );
}

export default Button;
