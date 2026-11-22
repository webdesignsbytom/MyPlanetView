import React from 'react';
import { Link } from 'react-router-dom';
// Data
import { gifts } from '@/utils/data/pricingData';
// Constants
import { GIFTS_PAGE_URL } from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';

// Gifts (docs/API.md "Gifts"): a year of Business or First Class, paid once, to give
function PricingGifts() {
  return (
    <PaperCard title='Give it as a gift' titleId='pricing-gifts-heading'>
      <p className='max-w-prose leading-relaxed'>{gifts.intro}</p>
      <Link to={GIFTS_PAGE_URL} className='btn-poster justify-self-start'>
        {gifts.cta}
      </Link>
    </PaperCard>
  );
}

export default PricingGifts;
