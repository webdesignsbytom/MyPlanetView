import React from 'react';
// Components
import BrassCorners from '@/components/common/BrassCorners';

// my_planet's poster frame: a red border with a brass corner protector in each corner,
// round the page's content (`children`) and its nav (`nav`). Used by the home page, the
// public, sign-in and signed-in pages, and the error screen.
// Below lg the nav is a bar across the top of the screen, full width, and the red frame
// starts under it, with its corners on the content alone (19 Nov 2026, the user's wish:
// the bar sat inside the frame, between the top corners). The frame fills the rest of the
// screen; its side padding grows with the screen (16px phones, 32px small tablets, 64px
// tablets), and 28px top and bottom brings the content out from under the corners' curved
// edge. The frame is isolated there, so its corners stay under the nav's menu as it opens.
// From lg up the nav is a full-height column beside the content, both inside the frame,
// with the corners over the column's ends.
// `backdrop` is drawn over the red and under everything else (the account page's stamps,
// StampBackdrop): the page is its own stacking context (`isolate`), so the layer's
// negative z-index keeps it above the red.
function PosterFrame({ nav = null, children, backdrop = null }) {
  return (
    <div className='relative isolate grid min-h-svh grid-rows-[auto_minmax(0,1fr)] bg-poster-red font-main lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-1 lg:gap-2 lg:p-2'>
      {backdrop ? <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>{backdrop}</div> : null}
      {/* From lg: the corners on the whole frame */}
      <span className='hidden lg:contents'>
        <BrassCorners />
      </span>
      {nav}
      {/* Below lg: the frame under the nav, with its own corners. From lg its children
          sit straight in the page's grid, beside the nav column. */}
      <div className='relative isolate row-start-2 grid min-w-0 px-4 py-7 sm:px-8 md:px-16 lg:contents'>
        <span className='contents lg:hidden'>
          <BrassCorners />
        </span>
        {children}
      </div>
    </div>
  );
}

export default PosterFrame;
