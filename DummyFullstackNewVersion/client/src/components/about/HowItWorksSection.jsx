import React from 'react';
// Components
import HowItWorksFeatures from './HowItWorksFeatures';
import HowItWorksGroups from './HowItWorksGroups';
import HowItWorksPrivacy from './HowItWorksPrivacy';
import HowItWorksCta from './HowItWorksCta';

// How it works, on the About page (the home page is the poster hero alone): what the
// map does, who it's for, the privacy promise and a way to start, on one sheet of
// cream paper split by dashed perforations. The home hero links here (#how-it-works).
function HowItWorksSection() {
  return (
    <div
      id='how-it-works'
      className='ticket-edge grid w-full scroll-mt-4 divide-y-2 divide-dashed divide-poster-brown overflow-hidden rounded-lg bg-paper-cream text-colour4'
    >
      <HowItWorksFeatures />
      <HowItWorksGroups />
      <HowItWorksPrivacy />
      <HowItWorksCta />
    </div>
  );
}

export default HowItWorksSection;
