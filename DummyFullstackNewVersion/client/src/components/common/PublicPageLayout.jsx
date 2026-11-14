import React from 'react';
// Components
import Navbar from '@/components/nav/Navbar';
import FooterComponent from '@/components/footer/FooterComponent';
import PosterFrame from './PosterFrame';

/**
 * The public pages' page (About, FAQ, Contact, legal, 404, maintenance, email checks):
 * the red poster frame with brass corners, the parchment nav (a column from lg up, a
 * bar with the MENU stamp below), the page's one <main>, then the footer.
 * Below lg the frame's padding sets the edges, so the nav bar and the content share
 * exactly the same left and right edges, 16px apart (the frame's 8px gap + 8px here).
 * From lg up the cards and the footer fill everything right of the sticky nav, edge to
 * edge within the frame, 8px apart (the frame's own gap); long text keeps a comfortable
 * line length inside each card rather than by narrowing the cards.
 * `mainProps` carries the page's own aria-labelledby / aria-describedby / aria-busy.
 */
function PublicPageLayout({ children, mainProps = {}, footer = true }) {
  return (
    <PosterFrame>
      <Navbar variant='column' />
      <div className='grid w-full min-w-0 content-start gap-4 pt-2 lg:gap-2 lg:pt-0'>
        <main id='main-content' role='main' tabIndex={-1} className='grid w-full min-w-0 content-start gap-4 lg:gap-2' {...mainProps}>
          {children}
        </main>
        {footer ? <FooterComponent /> : null}
      </div>
    </PosterFrame>
  );
}

export default PublicPageLayout;
