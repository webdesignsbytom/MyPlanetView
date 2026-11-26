import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import PricingCta from '@/components/pricing/PricingCta';
import PricingEveryPlan from '@/components/pricing/PricingEveryPlan';
import PricingExtraMaps from '@/components/pricing/PricingExtraMaps';
import PricingFeature from '@/components/pricing/PricingFeature';
import PricingGifts from '@/components/pricing/PricingGifts';
import PricingPageHeader from '@/components/pricing/PricingPageHeader';
import PricingPlanCard from '@/components/pricing/PricingPlanCard';
import PricingPlans from '@/components/pricing/PricingPlans';
import { EDITORS_PER_MAP, FREE_MAPS, PLANS, formatPence } from '@/utils/constants/plans';
import { adsLine, everyPlanFeatures, planTickets, pricingCta, pricingNotes } from '@/utils/data/pricingData';
import { renderPage, signedIn } from '../../pages/renderPage';

const { getBilling } = vi.hoisted(() => ({ getBilling: vi.fn() }));
vi.mock('@/api/plansApi', () => ({ getBilling }));

beforeEach(() => {
  getBilling.mockReset();
  getBilling.mockResolvedValue({ plan: 'REGULAR' });
});

const ticket = (id) => planTickets.find((t) => t.id === id);
const linkText = (container) => container.querySelector('a').textContent;

describe('PricingFeature', () => {
  it('a built feature has a tick and no "Coming soon"', () => {
    const { container } = render(<ul><PricingFeature feature={{ text: 'Slideshows' }} className='text-sm' /></ul>);
    const li = container.querySelector('li');
    expect(li.textContent).toBe('Slideshows');
    expect(li.className).toContain('text-sm');
    expect(li.querySelector('svg').getAttribute('class')).toContain('text-status-good');
  });

  it('a feature marked soon has a clock and says "Coming soon", never shown as there', () => {
    const { container } = render(<ul><PricingFeature feature={{ text: 'Map styles', soon: true }} /></ul>);
    const li = container.querySelector('li');
    expect(li.textContent).toBe('Map styles Coming soon');
    expect(li.querySelector('svg').getAttribute('class')).toContain('text-poster-brown');
    expect(li.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('PricingPlanCard', () => {
  it('Economy is free, with no card needed, and starts a map', () => {
    const { container } = renderPage(<PricingPlanCard ticket={ticket('FREE')} />);
    const article = container.querySelector('article');
    expect(article.getAttribute('aria-labelledby')).toBe('plan-free-heading');
    expect(container.querySelector('h3#plan-free-heading').textContent).toBe(PLANS.FREE.name);
    expect(article.textContent).toContain('Free');
    expect(article.textContent).toContain('No card needed');
    expect(linkText(container)).toBe('Start your map');
    expect(container.querySelector('a').getAttribute('href')).toBe('/sign-up');
    expect(container.querySelectorAll('li').length).toBe(ticket('FREE').features.length);
  });

  it('a paid plan shows its monthly and yearly prices from the plan constants', () => {
    const { container } = renderPage(<PricingPlanCard ticket={ticket('REGULAR')} />);
    const text = container.textContent;
    expect(text).toContain(`${formatPence(PLANS.REGULAR.price.MONTH)}a month`);
    expect(text).toContain(`or ${formatPence(PLANS.REGULAR.price.YEAR)} a year: two months free`);
    expect(linkText(container)).toBe(`Start with ${PLANS.REGULAR.name}`);
  });

  it('signed in, every plan goes to the account page, and "Choose" until the plan is known', () => {
    const premium = renderPage(<PricingPlanCard ticket={ticket('PREMIUM')} />, { auth: signedIn() });
    expect(linkText(premium.container)).toBe(`Choose ${PLANS.PREMIUM.name}`);
    expect(premium.container.querySelector('a').getAttribute('href')).toBe('/account');
    expect(premium.container.textContent).toContain(formatPence(PLANS.PREMIUM.price.MONTH));
    premium.unmount();
    const free = renderPage(<PricingPlanCard ticket={ticket('FREE')} />, { auth: signedIn() });
    expect(linkText(free.container)).toBe(`Choose ${PLANS.FREE.name}`);
    expect(free.container.querySelector('article').hasAttribute('data-current-plan')).toBe(false);
  });

  it('the account’s own plan says "Your plan", a lower one "Move to"', () => {
    const own = renderPage(<PricingPlanCard ticket={ticket('REGULAR')} currentPlan='REGULAR' />, { auth: signedIn() });
    expect(linkText(own.container)).toBe('Your plan');
    expect(own.container.querySelector('article').getAttribute('data-current-plan')).toBe('true');
    expect(own.container.querySelector('a').className).toContain('btn-paper');
    own.unmount();
    const lower = renderPage(<PricingPlanCard ticket={ticket('FREE')} currentPlan='REGULAR' />, { auth: signedIn() });
    expect(linkText(lower.container)).toBe(`Move to ${PLANS.FREE.name}`);
    lower.unmount();
    const higher = renderPage(<PricingPlanCard ticket={ticket('PREMIUM')} currentPlan='REGULAR' />, { auth: signedIn() });
    expect(linkText(higher.container)).toBe(`Choose ${PLANS.PREMIUM.name}`);
    expect(higher.container.querySelector('a').className).toContain('btn-poster');
  });

  it('signed out, a plan passed in changes nothing', () => {
    const { container } = renderPage(<PricingPlanCard ticket={ticket('FREE')} currentPlan='FREE' />);
    expect(linkText(container)).toBe('Start your map');
    expect(container.querySelector('article').hasAttribute('data-current-plan')).toBe(false);
  });

  it('an unknown plan id is shown as Economy', () => {
    const { container } = renderPage(<PricingPlanCard ticket={{ id: 'NOPE', tagline: 'x', features: [] }} />);
    expect(container.querySelector('h3').textContent).toBe(PLANS.FREE.name);
  });
});

describe('PricingPlans', () => {
  it('shows the three tickets in order and the ads line', () => {
    const { container } = renderPage(<PricingPlans />);
    expect([...container.querySelectorAll('article h3')].map((h) => h.textContent)).toEqual([PLANS.FREE.name, PLANS.REGULAR.name, PLANS.PREMIUM.name]);
    expect(container.querySelector('#pricing-plans-heading').textContent).toBe('The plans');
    expect(container.textContent).toContain(adsLine.lead);
    expect(container.textContent).toContain(formatPence(PLANS.PREMIUM.price.YEAR));
    expect(getBilling).not.toHaveBeenCalled();
  });

  it('signed in, asks for the account’s plan and marks that card', async () => {
    const { container } = renderPage(<PricingPlans />, { auth: signedIn() });
    await waitFor(() => expect(container.querySelector('[data-current-plan] h3')?.textContent).toBe(PLANS.REGULAR.name));
    expect(getBilling).toHaveBeenCalledTimes(1);
    const labels = [...container.querySelectorAll('article a')].map((a) => a.textContent);
    expect(labels).toEqual([`Move to ${PLANS.FREE.name}`, 'Your plan', `Choose ${PLANS.PREMIUM.name}`]);
  });

  it('signed in, a failed read leaves every card on "Choose"', async () => {
    getBilling.mockRejectedValue(new Error('offline'));
    const { container } = renderPage(<PricingPlans />, { auth: signedIn() });
    await waitFor(() => expect(getBilling).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.querySelector('[data-current-plan]')).toBe(null);
    expect([...container.querySelectorAll('article a')].map((a) => a.textContent)).toEqual(Object.values(PLANS).map((p) => `Choose ${p.name}`));
  });
});

describe('the plans’ postcards', () => {
  it('sells landmark and own-photo postcards from Business up, never on Economy', () => {
    const texts = (id) => planTickets.find((t) => t.id === id).features.map((f) => f.text);
    expect(texts('REGULAR')).toContain('Postcards of landmarks, and of your own photos');
    expect(texts('FREE').some((text) => /postcard/i.test(text))).toBe(false);
  });
});

describe('PricingEveryPlan', () => {
  it('lists what every plan has and the small print', () => {
    const { container } = render(<PricingEveryPlan />);
    const lists = container.querySelectorAll('ul');
    expect(lists[0].querySelectorAll('li').length).toBe(everyPlanFeatures.length);
    expect(lists[0].textContent).toContain(`up to ${EDITORS_PER_MAP} editors on each map`);
    // Postcards (26 Nov 2026): a country's on every plan, a landmark's or your own photo's on Business up
    expect(lists[0].textContent).toContain('Postcards from the places on your map, sent by a link');
    expect([...lists[1].querySelectorAll('li')].map((li) => li.textContent)).toEqual(pricingNotes.map((note) => note.text));
    expect(container.querySelector('#pricing-notes-heading').textContent).toBe('The small print');
    expect(lists[1].textContent).toContain(formatPence(PLANS.REGULAR.price.YEAR));
  });
});

describe('PricingExtraMaps', () => {
  it('prices an extra map on each plan from the constants', () => {
    const { container } = render(<PricingExtraMaps />);
    expect(container.textContent).toContain(`Every account has ${FREE_MAPS} maps free`);
    const rows = [...container.querySelectorAll('dl > div')];
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('dt').textContent).toBe(`On ${PLANS.FREE.name} and ${PLANS.REGULAR.name}`);
    expect(rows[0].querySelector('dd').textContent).toContain(`${formatPence(PLANS.REGULAR.extraMap.MONTH)} a month`);
    expect(rows[0].querySelector('dd').textContent).toContain(`${formatPence(PLANS.REGULAR.extraMap.YEAR)} a year`);
    expect(rows[1].querySelector('dt').textContent).toBe(`On ${PLANS.PREMIUM.name}`);
    expect(rows[1].querySelector('dd').textContent).toContain(formatPence(PLANS.PREMIUM.extraMap.MONTH));
    expect(rows[1].textContent).toContain('More, as it keeps videos.');
  });
});

describe('PricingGifts', () => {
  it('prices the gifts from the constants and links to the gifts page', () => {
    const { container } = renderPage(<PricingGifts />);
    expect(container.textContent).toContain(formatPence(PLANS.REGULAR.price.YEAR));
    expect(container.textContent).toContain(formatPence(PLANS.PREMIUM.price.YEAR));
    const link = container.querySelector('a');
    expect(link.textContent).toBe('Give a year of travel');
    expect(link.getAttribute('href')).toBe('/gifts');
  });
});

describe('PricingCta', () => {
  it('starts a map for a visitor, shows the plan to someone signed in', () => {
    const visitor = renderPage(<PricingCta />);
    expect(visitor.container.querySelector('#pricing-cta-heading').textContent).toBe(pricingCta.title);
    expect(linkText(visitor.container)).toBe('Start your map');
    expect(visitor.container.querySelector('a').getAttribute('href')).toBe('/sign-up');
    visitor.unmount();
    const member = renderPage(<PricingCta />, { auth: signedIn() });
    expect(linkText(member.container)).toBe('See your plan');
    expect(member.container.querySelector('a').getAttribute('href')).toBe('/account');
  });
});

describe('PricingPageHeader', () => {
  it('is the page’s h1, with the intro', () => {
    const { container } = renderPage(<PricingPageHeader />);
    expect(container.querySelector('h1#pricing-title').textContent).toContain('Pricing');
    expect(container.querySelector('#pricing-subtitle').textContent).toContain('Every map starts in Economy, free.');
  });
});
