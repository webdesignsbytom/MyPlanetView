import React from 'react';
// Data
import { everyPlanFeatures, pricingNotes } from '@/utils/data/pricingData';
// Components
import PaperCard from '@/components/common/PaperCard';
import PricingFeature from '@/components/pricing/PricingFeature';

// What comes with every plan, then the small print
function PricingEveryPlan() {
  return (
    <PaperCard title='On every plan' titleId='pricing-every-plan-heading' bodyClassName='gap-6'>
      <ul className='grid gap-3 md:grid-cols-2'>
        {everyPlanFeatures.map((feature) => (
          <PricingFeature key={feature.text} feature={feature} />
        ))}
      </ul>

      <section aria-labelledby='pricing-notes-heading' className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-5'>
        <h3 id='pricing-notes-heading' className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
          The small print
        </h3>
        <ul className='grid list-disc gap-2 pl-5 text-sm leading-relaxed'>
          {pricingNotes.map((note) => (
            <li key={note.text}>{note.text}</li>
          ))}
        </ul>
      </section>
    </PaperCard>
  );
}

export default PricingEveryPlan;
