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
//
// Offline (the installed app opened with no connection, and the page's code was never
// downloaded): it says so, and reloads by itself once the connection is back. It's only
// ever drawn in the browser, after an error, so it can read navigator.onLine.
function AppErrorScreen() {
  const headingRef = useRef(null);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!offline) return undefined;
    const reload = () => window.location.reload();
    window.addEventListener('online', reload, { once: true });
    return () => window.removeEventListener('online', reload);
  }, [offline]);

  return (
    <PosterFrame>
      <main
        id='main-content'
        role='main'
        tabIndex={-1}
        aria-labelledby='app-error-heading'
        // Both of the frame's columns from lg up: there's no nav beside it
        className='grid w-full min-w-0 place-items-center lg:col-span-2'
      >
        <PaperCard
          className='w-full max-w-xl'
          header={
            <PageTitleCard
              embedded
              page='Delayed'
              title={offline ? 'You’re offline' : 'Something went wrong'}
              headingId='app-error-heading'
              headingRef={headingRef}
              headingProps={{ tabIndex: -1 }}
              stamp={offline ? ['No', 'signal'] : ['Flight', 'delayed']}
            />
          }
        >
          <p className='max-w-prose leading-relaxed'>
            {offline
              ? 'This page needs a connection. It will open by itself as soon as you’re back online; your map and photos are safe.'
              : 'This page couldn’t be drawn. It may be a hiccup in the connection or a fault on our side. Reloading usually sorts it out; your map and photos are safe.'}
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
