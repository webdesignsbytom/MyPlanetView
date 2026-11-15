import React from 'react';
// Data
import { aboutSections } from '@/utils/data/aboutData';
// Components
import PaperCard from '@/components/common/PaperCard';
import AboutSection from './AboutSection';
import HowItWorksSection from './HowItWorksSection';

// The About page under its title: the story on one sheet of paper (sections split by
// dashed perforations), then How it works (#how-it-works, linked from the home hero;
// hooks/FocusMainOnRouteChange.js scrolls to it, as to every hash link).
function AboutPageMainContainer() {
  return (
    <>
      <PaperCard aria-label='Our story' bodyClassName='divide-y-2 divide-dashed divide-poster-brown gap-0'>
        {aboutSections.map((section) => (
          <AboutSection key={section.id} {...section} />
        ))}
      </PaperCard>

      <HowItWorksSection />
    </>
  );
}

export default AboutPageMainContainer;
