import React from 'react';
// Components
import Navbar from '@/components/nav/Navbar';
import FooterComponent from '@/components/footer/FooterComponent';
import PosterFrame from './PosterFrame';

/**
 * A signed-in page that isn't the map or a trip (the onboarding after sign-up, an emailed
 * invite, the account and admin pages), as travel paperwork on the poster: the red frame
 * with brass corners, the parchment nav (a column from lg up, a bar with the MENU stamp
 * below), the page's one <main>, then the footer.
 * The main holds the page's paperwork (a TravelTicket, or a PageTitleCard and PaperCards)
 * in a centred column at most `width` wide. Below lg the frame's padding sets the edges,
 * as on the public pages; from lg a short page sits in the middle of the red, with the
 * footer at the bottom. `mainProps` carries the page's aria-labelledby / -describedby /
 * aria-busy.
 */
function AppPageShell({ children, width = 'max-w-5xl', mainProps = {} }) {
  return (
    <PosterFrame>
      <Navbar variant='column' />
      <div className='grid min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-4 pt-2 lg:gap-2 lg:pt-0'>
        <main
          id='main-content'
          role='main'
          tabIndex={-1}
          className='grid min-w-0 content-start justify-items-center lg:content-center lg:px-6 lg:py-6'
          {...mainProps}
        >
          <div className={`grid w-full min-w-0 gap-4 ${width}`}>{children}</div>
        </main>
        <FooterComponent />
      </div>
    </PosterFrame>
  );
}

export default AppPageShell;
