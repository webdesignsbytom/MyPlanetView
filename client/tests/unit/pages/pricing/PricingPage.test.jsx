import React from 'react';
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import PricingPage from '@/pages/pricing/PricingPage';
import { PRICING_PAGE_URL } from '@/utils/constants/routes';
import { PLANS } from '@/utils/constants/plans';
import { headings, onlyMain, renderPage } from '../renderPage';

describe('PricingPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<PricingPage />, { path: PRICING_PAGE_URL });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('pricing-title');
    expect(main.getAttribute('aria-describedby')).toBe('pricing-subtitle');
    expect(headings()).toEqual(['Pricing']);
  });

  it('shows every plan by name, all in the first render', () => {
    renderPage(<PricingPage />, { path: PRICING_PAGE_URL });
    const text = document.querySelector('main').textContent;
    for (const plan of Object.values(PLANS)) expect(text).toContain(plan.name);
  });

  it('is indexed, with the pricing structured data', async () => {
    renderPage(<PricingPage />, { path: PRICING_PAGE_URL });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index,follow'));
    expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBeGreaterThan(0);
  });
});
