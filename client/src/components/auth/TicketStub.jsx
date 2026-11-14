import React from 'react';

// Half-circle punches where the perforation meets the ticket's edge: top and bottom on
// the column (sm up), left and right on the phone strip. The ticket clips them to halves.
const NOTCH = 'absolute h-5 w-5 rounded-full border-2 border-poster-brown bg-poster-red';

// The ticket's tear-off stub: a perforated edge, a round red stamp and a few ticket
// details. Decorative (hidden from screen readers); a strip along the bottom on phones,
// a column down the right from sm up. `stamp` is the stamp's words, one per line.
function TicketStub({ lines = [], stamp = ['Admit', 'one'] }) {
  return (
    <aside
      aria-hidden='true'
      className='paper-aged relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-t-2 border-dashed border-poster-brown px-7 py-5 font-travel uppercase sm:grid-cols-1 sm:content-center sm:justify-items-center sm:border-l-2 sm:border-t-0 sm:px-3 sm:text-center'
    >
      <span className={`${NOTCH} -left-2.5 -top-2.5 sm:-left-2.5 sm:-top-2.5`} />
      <span className={`${NOTCH} -right-2.5 -top-2.5 sm:-bottom-2.5 sm:-left-2.5 sm:right-auto sm:top-auto`} />
      <span className='grid h-20 w-20 rotate-[-12deg] place-content-center rounded-full border-4 border-double border-poster-red text-center text-xs leading-tight text-poster-red'>
        {stamp.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </span>
      <ul className='grid gap-1 text-xs tracking-wide text-poster-brown'>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}

export default TicketStub;
