import React from 'react';
// Constants
import { FULL_BUSINESS_URL } from '@/utils/constants/constants';
// Utils
import { buildBreadcrumbLd } from '@/utils/seo/breadcrumbs';
// Components
import AppLink from '@/components/common/AppLink';

// Visible trail and its BreadcrumbList from one list, so they can't disagree
function Breadcrumbs({ items = [], className = '' }) {
  const trail = items.filter((crumb) => crumb?.name && crumb?.href);
  if (trail.length < 2) return null;

  const breadcrumbLd = buildBreadcrumbLd({ baseUrl: FULL_BUSINESS_URL, items: trail });

  return (
    <>
      <script type='application/ld+json'>{JSON.stringify(breadcrumbLd)}</script>
      <nav aria-label='Breadcrumb' className={className}>
        <ol className='flex items-center gap-x-2 text-sm'>
          {trail.map((crumb, i) => {
            const isCurrent = i === trail.length - 1;
            return (
              <li
                key={crumb.href}
                className={isCurrent ? 'flex min-w-[8ch] flex-1 gap-x-2' : 'flex shrink-0 gap-x-2'}
              >
                {i > 0 && <span aria-hidden='true'>/</span>}
                {isCurrent ? (
                  <span aria-current='page' className='truncate'>
                    {crumb.name}
                  </span>
                ) : (
                  <AppLink to={crumb.href} label={crumb.name} className='underline hover:opacity-80' />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

export default Breadcrumbs;
