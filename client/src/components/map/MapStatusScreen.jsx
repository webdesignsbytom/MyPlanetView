import React from 'react';
import { Link } from 'react-router-dom';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Components
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// The full-screen map page while it loads, or when it can't open: a paper card (the map
// panels' travel paperwork) on the sea. `children` adds a way out (a btn-poster link).
function MapStatusScreen({ loading = false, title, message, children }) {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      role='main'
      className='grid min-h-dvh place-items-center bg-map-sea px-4 animate-ocean motion-reduce:animate-none'
    >
      <div className='ticket-edge grid w-full max-w-md overflow-hidden bg-paper-cream text-center text-colour4'>
        {loading ? (
          <div role='status' className='grid justify-items-center gap-4 px-6 py-8'>
            <LoadingSpinner lg />
            <span className='font-travel text-2xl uppercase tracking-wide text-colour6'>{title || 'Opening your map…'}</span>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </main>
  );
}

export default MapStatusScreen;
