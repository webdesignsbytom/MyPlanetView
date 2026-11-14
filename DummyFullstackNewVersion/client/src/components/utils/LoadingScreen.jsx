import React from 'react';
// Components
import LoadingSpinner from './LoadingSpinner';
import Navbar from '../nav/Navbar';

function LoadingScreen() {
  return (
    <section>
      <Navbar />
      <div
        id='loading-screen'
        className='grid h-screen max-h-screen min-h-screen w-full overflow-hidden justify-center items-center'
        aria-live='polite'
        aria-busy='true'
        role='alert'
        aria-labelledby='loading-description'
      >
        <article className='grid gap-2 h-fit items-center justify-center px-8 text-center'>
          <div>
            <p id='loading-description' className='text-2xl'>
              The content is loading, please wait...
            </p>
          </div>
          <div className='grid justify-center mx-auto'>
            {/* Spinner for visual feedback */}
            <LoadingSpinner md={true} />
          </div>
        </article>
      </div>
    </section>
  );
}

export default LoadingScreen;
