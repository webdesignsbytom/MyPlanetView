import React from 'react';
// Data
import { adsLine, planTickets } from '@/utils/data/pricingData';
// Components
import PricingPlanCard from './PricingPlanCard';

// The three plans side by side (stacked on phones), then the one line about ads that
// the plans allow (docs/FEATURE-PLAN.md, "Ads by tier")
function PricingPlans() {
  return (
    <section aria-labelledby='pricing-plans-heading' className='grid gap-4 lg:gap-2'>
      <h2 id='pricing-plans-heading' className='sr-only'>
        The plans
      </h2>
      <div className='grid gap-4 md:grid-cols-3 lg:gap-2'>
        {planTickets.map((ticket) => (
          <PricingPlanCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
      <p className='ticket-edge paper-aged rounded-lg px-6 py-4 text-sm leading-relaxed text-poster-ink sm:px-8'>
        <strong className='font-semibold'>{adsLine.lead}</strong> {adsLine.text}
      </p>
    </section>
  );
}

export default PricingPlans;
