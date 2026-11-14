import React from 'react';
// Components
import HomePageHeader from './HomePageHeader';

// The home page is the poster hero alone; how it works, who it's for and the privacy
// promise are on the About page.
function HomePageMainContainer() {
  return (
    <main id='main-content' role='main' tabIndex={-1} aria-labelledby='home-heading' className='grid w-full min-w-0'>
      <HomePageHeader />
    </main>
  );
}

export default HomePageMainContainer;
