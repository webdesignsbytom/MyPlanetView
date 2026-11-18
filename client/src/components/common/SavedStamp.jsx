import React from 'react';
// Icons
import { FaCheck } from 'react-icons/fa';

// "Saved", pressed onto the paper as a rubber stamp (17 Nov 2026, the user's wish: the plain
// green note looked dull): green ink in a double frame, tilted as a hand presses it, landing
// with a thump (stamp-in; none with reduced motion), centred. A polite status, so screen
// readers say it. `children` is the word.
function SavedStamp({ children = 'Saved' }) {
  return (
    <div role='status' className='grid justify-items-center py-1'>
      <p className='grid -rotate-3 animate-stamp-in grid-cols-[auto_auto] items-center gap-2 rounded-md border-4 border-double border-status-good px-5 py-1.5 font-travel text-2xl uppercase leading-none tracking-widest text-status-good motion-reduce:animate-none'>
        <FaCheck aria-hidden='true' className='text-lg' />
        <span>{children}</span>
      </p>
    </div>
  );
}

export default SavedStamp;
