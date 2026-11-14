import React from 'react';

// A round postmark, for the hover postcard: the visit status inked in a double brown
// ring, struck at a slant. Decorative; the caller hides it from assistive tech or says
// the same thing in words.
function Postmark({ children }) {
  return (
    <span className='grid h-14 w-14 -rotate-12 place-content-center rounded-full border-4 border-double border-colour9 p-1 text-center text-2xs font-semibold uppercase leading-none tracking-wide text-colour9 opacity-90'>
      {children}
    </span>
  );
}

export default Postmark;
