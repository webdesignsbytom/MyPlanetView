import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// Data
import { aboutSections } from '@/utils/data/aboutData';
// Components
import PaperCard from '@/components/common/PaperCard';
import AboutSection from './AboutSection';
import HowItWorksSection from './HowItWorksSection';

// The About page under its title: the story on one sheet of paper (sections split by
// dashed perforations), then How it works (#how-it-works, linked from the home hero).
function AboutPageMainContainer() {
  const { hash } = useLocation();

  // Arriving from a link like /about#how-it-works: scroll to it once the page is drawn
  // (an in-app link doesn't do that by itself)
  useEffect(() => {
    if (!hash) return undefined;
    const frame = requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

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
