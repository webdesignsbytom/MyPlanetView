import React from 'react';
// Icons
import { FiCheck } from 'react-icons/fi';
// Data
import { everyPlanFeatures, pricingNotes } from '@/utils/data/pricingData';
// Components
import PaperCard from '@/components/common/PaperCard';

// What comes with every plan, then the small print
function PricingEveryPlan() {
  return (
    <PaperCard title='On every plan' titleId='pricing-every-plan-heading' bodyClassName='gap-6'>
      <ul className='grid gap-3 md:grid-cols-2'>
        {everyPlanFeatures.map((feature) => (
          <li key={feature.text} className='grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 leading-relaxed'>
            <FiCheck aria-hidden='true' className='translate-y-1 text-status-good' />
            <span>{feature.text}</span>
          </li>
        ))}
      </ul>

      <section aria-labelledby='pricing-notes-heading' className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-5'>
        <h3 id='pricing-notes-heading' className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
          The small print
        </h3>
        <ul className='grid list-disc gap-2 pl-5 text-sm leading-relaxed'>
          {pricingNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </PaperCard>
  );
}

export default PricingEveryPlan;
