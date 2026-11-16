import React from 'react';
// Data
import { pricingIntro } from '@/utils/data/pricingData';
// Components
import PageTitleCard from '@/components/common/PageTitleCard';

// The Pricing page's title card (its one h1)
function PricingPageHeader() {
  return (
    <PageTitleCard
      page='Pricing'
      title='Pricing'
      headingId='pricing-title'
      subtitle={pricingIntro}
      subtitleId='pricing-subtitle'
      stamp={['Fares', 'from £0']}
    />
  );
}

export default PricingPageHeader;
