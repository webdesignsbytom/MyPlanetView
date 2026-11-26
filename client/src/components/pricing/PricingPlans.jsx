import React, { useEffect, useState } from 'react';
// Auth
import { useAuth } from '@/auth/AuthContext';
// API
import { getBilling } from '@/api/plansApi';
// Data
import { adsLine, planTickets } from '@/utils/data/pricingData';
// Components
import PricingPlanCard from './PricingPlanCard';

// The three plans side by side (stacked on phones), then the one line about ads that
// the plans allow (docs/FEATURE-PLAN.md, "Ads by tier"). Signed in, it asks which plan
// the account is on (GET /billing), so that card says "Your plan".
function PricingPlans() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [current, setCurrent] = useState({ userId: null, plan: null });

  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    getBilling()
      .then((billing) => alive && setCurrent({ userId, plan: billing?.plan ?? null }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId]);

  // Another account's answer (or none, signed out) is never shown
  const currentPlan = userId && current.userId === userId ? current.plan : null;

  return (
    <section aria-labelledby='pricing-plans-heading' className='grid gap-4 lg:gap-2'>
      <h2 id='pricing-plans-heading' className='sr-only'>
        The plans
      </h2>
      <div className='grid gap-4 md:grid-cols-3 lg:gap-2'>
        {planTickets.map((ticket) => (
          <PricingPlanCard key={ticket.id} ticket={ticket} currentPlan={currentPlan} />
        ))}
      </div>
      <p className='ticket-edge paper-aged rounded-lg px-6 py-4 text-sm leading-relaxed text-poster-ink sm:px-8'>
        <strong className='font-semibold'>{adsLine.lead}</strong> {adsLine.text}
      </p>
    </section>
  );
}

export default PricingPlans;
