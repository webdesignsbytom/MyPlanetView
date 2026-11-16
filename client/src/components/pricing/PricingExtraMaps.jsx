import React from 'react';
// Data
import { extraMaps } from '@/utils/data/pricingData';
// Components
import PaperCard from '@/components/common/PaperCard';

// More than one map: what an extra map costs on each plan, and an example
function PricingExtraMaps() {
  return (
    <PaperCard title='More than one map' titleId='pricing-extra-maps-heading'>
      <p className='max-w-prose leading-relaxed'>{extraMaps.intro}</p>
      <dl className='grid gap-3 sm:grid-cols-2'>
        {extraMaps.prices.map((row) => (
          <div key={row.plans} className='grid content-start gap-1 border-2 border-dashed border-poster-brown/60 px-4 py-3'>
            <dt className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>On {row.plans}</dt>
            <dd>
              <span className='font-semibold'>{row.month} a month</span> or {row.year} a year for each extra map
              {row.note ? <span className='block text-sm opacity-80'>{row.note}.</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className='max-w-prose text-sm leading-relaxed'>{extraMaps.example}</p>
    </PaperCard>
  );
}

export default PricingExtraMaps;
