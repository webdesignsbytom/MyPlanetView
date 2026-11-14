import React from 'react';
import { Link } from 'react-router-dom';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Components
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// The full-screen map page while it loads, or when it can't open. `children` adds a way out.
function MapStatusScreen({ loading = false, title, message, children }) {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      role='main'
      className='grid min-h-dvh place-items-center bg-map-sea px-4 text-map-sea-ink animate-ocean motion-reduce:animate-none'
    >
      <div className='grid max-w-md justify-items-center gap-4 text-center'>
        {loading ? (
          <div role='status' className='grid justify-items-center gap-3'>
            <LoadingSpinner lg />
            <span className='text-lg font-medium'>{title || 'Opening your map…'}</span>
          </div>
        ) : (
          <>
            <h1 className='text-2xl font-semibold'>{title}</h1>
            {message ? <p>{message}</p> : null}
            {children || (
              <Link to={HOME_PAGE_URL} className='font-medium underline underline-offset-2'>
                Back to the home page
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default MapStatusScreen;
