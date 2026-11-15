import React, { useEffect, useRef } from 'react';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Components
import PosterFrame from '@/components/common/PosterFrame';
import PaperCard from '@/components/common/PaperCard';
import PageTitleCard from '@/components/common/PageTitleCard';

// What the app's error boundary shows when a page fails to draw (a bug, or a page's code
// that didn't download): the poster frame with one paper card, "Flight delayed", and a
// way to try again. It sits outside the router and the auth context, so it uses plain
// links and nothing that needs them. Focus moves to its heading.
function AppErrorScreen() {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <PosterFrame>
      <main
        id='main-content'
        role='main'
        tabIndex={-1}
        aria-labelledby='app-error-heading'
        // Both of the frame's rows (columns from lg up): there's no nav beside it
        className='row-span-2 grid w-full min-w-0 place-items-center lg:col-span-2 lg:row-span-1'
      >
        <PaperCard
          className='w-full max-w-xl'
          header={
            <PageTitleCard
              embedded
              page='Delayed'
              title='Something went wrong'
              headingId='app-error-heading'
              headingRef={headingRef}
              headingProps={{ tabIndex: -1 }}
              stamp={['Flight', 'delayed']}
            />
          }
        >
          <p className='max-w-prose leading-relaxed'>
            This page couldn’t be drawn. It may be a hiccup in the connection or a fault on our side. Reloading
            usually sorts it out; your map and photos are safe.
          </p>
          <div className='grid gap-3 sm:grid-cols-[auto_auto] sm:justify-start'>
            <button type='button' className='btn-poster' onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <a href={HOME_PAGE_URL} className='btn-paper'>
              Back to the home page
            </a>
          </div>
        </PaperCard>
      </main>
    </PosterFrame>
  );
}

export default AppErrorScreen;
