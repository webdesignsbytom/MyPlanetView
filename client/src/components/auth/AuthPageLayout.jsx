import React from 'react';
// Components
import Navbar from '@/components/nav/Navbar';
import PosterFrame from '@/components/common/PosterFrame';

// The sign-in pages' page: the home page's red poster frame with brass corners and the
// nav as a column from lg up, and the page's one <main>, centring its ticket.
// `mainProps` carries the page's own aria-labelledby / aria-describedby.
function AuthPageLayout({ children, mainProps = {} }) {
  return (
    <PosterFrame>
      <Navbar variant='column' />
      <main
        id='main-content'
        role='main'
        tabIndex={-1}
        // Below lg the frame's padding sets the edges, so the ticket lines up with the nav
        // bar, and the ticket sits 16px under it (the frame's 8px gap + 8px here), at the
        // top rather than centred; from lg it's centred beside the nav column
        className='grid min-w-0 items-start justify-items-center pb-6 pt-2 lg:items-center lg:px-6 lg:py-6'
        {...mainProps}
      >
        {children}
      </main>
    </PosterFrame>
  );
}

export default AuthPageLayout;
