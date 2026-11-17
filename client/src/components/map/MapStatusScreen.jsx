import React from 'react';
import { Link } from 'react-router-dom';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Components
import StampLoading from './StampLoading';

// The full-screen map page while it loads, or when it can't open, on the sea. Loading, it's
// "Loading…" in plain words over passport stamps pressed on one after another (StampLoading;
// 17 Nov 2026, the user's wish: no card); when it can't open, a paper card (the map panels'
// travel paperwork). `children` adds a way out (a btn-poster link).
// `overlay`: over the map page while its panels' data loads (MapExperience), a layer of its
// own instead of the page's <main>.
function MapStatusScreen({ loading = false, overlay = false, title, message, children }) {
  const Shell = overlay ? 'div' : 'main';
  // data-map-loading: the e2e tests wait for the overlay to go before using the map
  const shellProps = overlay ? { 'data-map-loading': '' } : { id: 'main-content', tabIndex: -1, role: 'main' };
  return (
    <Shell
      {...shellProps}
      className={`grid place-items-center overflow-hidden bg-map-sea px-4 animate-ocean motion-reduce:animate-none ${
        overlay ? 'fixed inset-0 z-[60]' : 'relative min-h-dvh'
      }`}
    >
      {loading ? (
        // The words in the middle of the screen (17 Nov 2026, the user's wish), the stamps
        // in the half below them
        <div role='status' className='grid justify-items-center'>
          <span className='font-travel text-3xl uppercase tracking-wide text-poster-cream sm:text-4xl'>{title || 'Loading…'}</span>
          <div className='absolute inset-x-4 bottom-4 top-[calc(50%_+_2.5rem)] grid justify-items-center'>
            <StampLoading />
          </div>
        </div>
      ) : (
        <div className='ticket-edge grid w-full max-w-md overflow-hidden bg-paper-cream text-center text-colour4'>
          <div className='paper-aged border-b-2 border-dashed border-poster-brown px-6 pb-4 pt-5'>
            <h1 className='font-travel text-3xl uppercase leading-tight tracking-wide text-poster-red-deep'>{title}</h1>
          </div>
          <div className='grid justify-items-center gap-4 px-6 py-6'>
            {message ? <p>{message}</p> : null}
            {children || (
              <Link to={HOME_PAGE_URL} className='btn-poster'>
                Back to the home page
              </Link>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

export default MapStatusScreen;
