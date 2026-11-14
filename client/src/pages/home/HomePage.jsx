import React from 'react';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import {
  homePageAdditionalMeta,
  homePageStructuredData,
  websiteStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import Navbar from '@/components/nav/Navbar';
import PosterFrame from '@/components/common/PosterFrame';
import HomePageMainContainer from '@/components/home/HomePageMainContainer';

const HomePage = React.memo(() => {
  const pageHelmet = helmetData[HOME_PAGE_URL];

  return (
    <>
      {/* Tab Data */}
      <HelmetItem
        PageName={pageHelmet.pageName}
        title={pageHelmet.title}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={homePageAdditionalMeta}
        structuredData={[homePageStructuredData, websiteStructuredData]}
        canonicalPath={HOME_PAGE_URL}
      />

      {/* Page: my_planet's poster frame, with the nav as a column from lg up, and the
          poster hero alone (everything else is on the About page) */}
      <PosterFrame>
        <Navbar variant='column' />
        <HomePageMainContainer />
      </PosterFrame>
    </>
  );
});

export default HomePage;
