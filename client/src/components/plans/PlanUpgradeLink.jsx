import React from 'react';
// Constants
import { ACCOUNT_PAGE_URL, PRICING_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppLink from '@/components/common/AppLink';

const LINK_CLASS = 'font-semibold text-poster-red-deep underline underline-offset-2';

// Where to go for more room: the owner to their plan on the account page; anyone else
// (a map's plan is always its owner's) to the plans, with a word on who can upgrade
function PlanUpgradeLink({ isOwner = false }) {
  if (isOwner) return <AppLink to={ACCOUNT_PAGE_URL} label='Upgrade your plan' className={LINK_CLASS} />;
  return (
    <span>
      The map’s owner can upgrade its plan. <AppLink to={PRICING_PAGE_URL} label='See the plans' className={LINK_CLASS} />
    </span>
  );
}

export default PlanUpgradeLink;
