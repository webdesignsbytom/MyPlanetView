import React from 'react';

// A round red rubber stamp, as on the boarding pass's "Admit one": a double ring, the
// words in the travel face, tilted like a stamp pressed by hand. Decorative (hidden
// from screen readers). `lines` are the stamp's words, one per line.
function RubberStamp({ lines = [], className = '' }) {
  return (
    <span
      aria-hidden='true'
      className={`grid h-24 w-24 rotate-[-12deg] place-content-center rounded-full border-4 border-double border-poster-red p-2 text-center font-travel text-xs uppercase leading-tight tracking-wide text-poster-red ${className}`}
    >
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </span>
  );
}

export default RubberStamp;
