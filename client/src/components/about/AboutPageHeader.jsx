import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Data
import { aboutIntro } from '@/utils/data/aboutData';
// Components
import PageTitleCard from '@/components/common/PageTitleCard';

// The About page's title card (its one h1)
function AboutPageHeader() {
  return (
    <PageTitleCard
      page='About'
      title={`About ${CompanyName}`}
      headingId='about-title'
      subtitle={aboutIntro}
      subtitleId='about-subtitle'
      stamp={['Bon', 'voyage']}
    />
  );
}

export default AboutPageHeader;
