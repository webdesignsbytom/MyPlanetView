import React from 'react';
// Components
import Navbar from '@/components/nav/Navbar';
import FooterComponent from '@/components/footer/FooterComponent';

// A signed-in page that isn't the full-screen map (a trip, onboarding, an invite):
// the site's nav, one <main>, the footer.
function AppPageShell({ children, width = 'max-w-5xl' }) {
  return (
    <div className='grid min-h-screen grid-rows-a1a'>
      <Navbar />
      <main id='main-content' tabIndex={-1} role='main' className='grid w-full content-start'>
        <div className={`mx-auto grid w-full gap-8 px-4 py-8 md:px-8 ${width}`}>{children}</div>
      </main>
      <div className='pt-12'>
        <FooterComponent />
      </div>
    </div>
  );
}

export default AppPageShell;
