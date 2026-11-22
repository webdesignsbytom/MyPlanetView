import React from 'react';
// Constants
import { PRICING_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import { pricingPageAdditionalMeta, pricingPageStructuredData } from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PricingPageHeader from '@/components/pricing/PricingPageHeader';
import PricingPlans from '@/components/pricing/PricingPlans';
import PricingExtraMaps from '@/components/pricing/PricingExtraMaps';
import PricingGifts from '@/components/pricing/PricingGifts';
import PricingEveryPlan from '@/components/pricing/PricingEveryPlan';
import PricingCta from '@/components/pricing/PricingCta';

// The plans, side by side, for people deciding (public, pre-rendered and indexed). It
// leads with the map, its looks and private sharing; the photo limits are a line each.
// Everything is in the first render (the build saves that), from the plan constants.
function PricingPage() {
  const pageHelmet = helmetData[PRICING_PAGE_URL];

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        title={pageHelmet.title}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pricingPageAdditionalMeta}
        structuredData={[pricingPageStructuredData]}
        canonicalPath={PRICING_PAGE_URL}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'pricing-title', 'aria-describedby': 'pricing-subtitle' }}>
        <PricingPageHeader />
        <PricingPlans />
        <PricingExtraMaps />
        <PricingGifts />
        <PricingEveryPlan />
        <PricingCta />
      </PublicPageLayout>
    </>
  );
}

export default PricingPage;
