import React, { Children, useLayoutEffect, useRef, useState } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

// The map's notes that come and go (a trip just ended, a moment's day come round, the year's
// recap, the countdown to the next trip), one at a time, with arrows between them (26 Nov
// 2026, the audit: stacked, they covered Alaska, Hawaii and the west coast on a desktop and
// the top third of a phone's map, Europe included). Each note decides for itself whether it
// shows (it may render nothing, arrive once its data does, or be closed): the stack watches
// which do, and shows the first in the order given until the viewer picks another.
function MapTagStack({ children }) {
  const boxRef = useRef(null);
  const notes = Children.toArray(children);
  // The slots (each note's key) with a note in them, in order
  const [present, setPresent] = useState([]);
  // The slot the viewer moved to with the arrows (null: the first present)
  const [chosen, setChosen] = useState(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    const read = () => {
      const next = [...box.querySelectorAll(':scope > [data-tag-slot]')].filter((slot) => slot.firstElementChild).map((slot) => slot.dataset.tagSlot);
      setPresent((was) => (was.length === next.length && was.every((slot, i) => slot === next[i]) ? was : next));
    };
    read();
    if (typeof MutationObserver !== 'function') return undefined;
    const watcher = new MutationObserver(read);
    watcher.observe(box, { childList: true, subtree: true });
    return () => watcher.disconnect();
  }, [notes.length]);

  const shown = present.includes(chosen) ? chosen : (present[0] ?? null);
  const place = present.indexOf(shown);
  const step = (by) => setChosen(present[(place + by + present.length) % present.length]);

  return (
    // Hidden while it has none, so it adds no gap to the column
    <div ref={boxRef} className={present.length ? 'grid justify-items-start gap-1' : 'hidden'} data-map-tag-stack={present.length}>
      {notes.map((note) => (
        <div key={note.key} data-tag-slot={note.key} className={note.key === shown ? 'grid justify-items-start' : 'hidden'}>
          {note}
        </div>
      ))}
      {present.length > 1 ? (
        <div
          role='group'
          aria-label='More notes'
          className='paper-aged pointer-events-auto grid grid-cols-[auto_auto_auto] items-center gap-1 rounded-full border-2 border-poster-brown px-1 py-0.5 text-xs font-semibold text-poster-ink shadow-paper'
          data-tag-stepper=''
        >
          <button
            type='button'
            onClick={() => step(-1)}
            aria-label='Previous note'
            className='grid h-6 w-6 place-items-center rounded-full text-poster-red-deep transition hover:bg-poster-wash active:scale-95'
          >
            <IoChevronBack aria-hidden='true' />
          </button>
          <span aria-live='polite' className='px-1 tabular-nums'>
            {place + 1} of {present.length}
          </span>
          <button
            type='button'
            onClick={() => step(1)}
            aria-label='Next note'
            className='grid h-6 w-6 place-items-center rounded-full text-poster-red-deep transition hover:bg-poster-wash active:scale-95'
          >
            <IoChevronForward aria-hidden='true' />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default MapTagStack;
