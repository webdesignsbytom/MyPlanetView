import React from 'react';
// Components
import BrassCorners from '@/components/common/BrassCorners';

// my_planet's poster frame: a red border round the whole page with a brass corner
// protector in each corner. Its children are the nav and the page's content: stacked
// below lg (the content row fills the rest of the screen), side by side from lg up
// (the nav as a full-height column). Used by the home page and the sign-in pages.
// Below lg the side padding grows with the screen, so the nav bar and the content share
// the same edges (16px phones, 32px small tablets, 64px tablets), and 28px top and
// bottom brings them out from under the brass corners' curved edge.
function PosterFrame({ children }) {
  return (
    <div className='relative grid min-h-svh grid-rows-[auto_minmax(0,1fr)] gap-2 bg-poster-red px-4 py-7 font-main sm:px-8 md:px-16 lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-1 lg:px-2 lg:py-2'>
      <BrassCorners />
      {children}
    </div>
  );
}

export default PosterFrame;
