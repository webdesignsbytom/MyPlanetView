import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlanChoices from '@/components/account/PlanChoices';

const FREE = { plan: 'FREE', source: 'NONE', status: null, interval: null, paymentsEnabled: true, promoTrial: null, inviteOffer: null };
const PAYING = { ...FREE, plan: 'REGULAR', source: 'STRIPE', status: 'active', interval: 'MONTH' };

const open = (billing, props = {}) => {
  const onChoose = vi.fn();
  const view = render(
    <MemoryRouter>
      <PlanChoices billing={billing} interval='MONTH' onChoose={onChoose} {...props} />
    </MemoryRouter>,
  );
  const cards = () => [...view.container.querySelectorAll('li')].map((li) => li.textContent);
  return { onChoose, cards, ...view };
};

describe('PlanChoices', () => {
  it('offers Economy both paid plans as Checkouts', () => {
    const { cards, onChoose } = open(FREE);
    expect(cards()).toEqual([
      'Business£4.99 a month. 200 photos of each country, originals kept.Upgrade to Business',
      'First Class£9.99 a month. 1,000 photos of each country, originals kept, videos.Upgrade to First Class',
    ]);
    expect(screen.getByText(/You pay on Stripe’s secure checkout, then come back here./)).toBeTruthy();
    expect(screen.getByText('Compare the plans').getAttribute('href')).toBe('/pricing');
    fireEvent.click(screen.getByText('Upgrade to First Class'));
    expect(onChoose).toHaveBeenCalledWith('PREMIUM');
  });

  it('prices the choices on the chosen interval', () => {
    const { cards } = open(FREE, { interval: 'YEAR' });
    expect(cards()[0]).toContain('£49 a year.');
    expect(cards()[1]).toContain('£99 a year.');
  });

  it('says there’s nothing to upgrade to on the top plan without a subscription', () => {
    open({ ...FREE, plan: 'PREMIUM', source: 'COMPLIMENTARY' });
    expect(screen.getByText('You’re on our top plan, so there’s nothing to upgrade to.')).toBeTruthy();
  });

  it('turns a promo code into a free month on either plan', () => {
    const { cards, container } = open({ ...FREE, promoTrial: { code: 'SAMTRAVELS', days: 30 } });
    const note = container.querySelector('[data-testid="promo-trial"]');
    expect(note.textContent).toBe(
      'Your code SAMTRAVELS makes your first month free on Business or First Class. Checkout asks for a card; nothing is charged for 30 days, and if you cancel before then you pay nothing.',
    );
    expect(screen.getByText('Start a free month of Business')).toBeTruthy();
    expect(screen.getByText('Start a free month of First Class')).toBeTruthy();
    expect(cards()[0]).toContain('Free for 30 days, then £4.99 a month.');
  });

  it('shows the invite offer’s half price on the plans it covers', () => {
    const { cards, container } = open({ ...FREE, inviteOffer: { plan: 'REGULAR', endsAt: '2026-11-29' } });
    expect(container.querySelector('[data-testid="invite-offer"]').textContent).toBe(
      'A welcome offer from your invite: Business at half price for your first 3 months, or £7.49 off a year of Business. Choose it by 29 Nov 2026.',
    );
    expect(cards()[0]).toContain('£2.49 a month for 3 months, then £4.99 a month.');
    // Business's offer doesn't cover First Class
    expect(cards()[1]).not.toContain('for 3 months');
    expect(screen.getByText('Upgrade to Business')).toBeTruthy();
  });

  it('gives a First Class invite offer on both plans, and a year’s saving yearly', () => {
    const { cards, container } = open({ ...FREE, inviteOffer: { plan: 'PREMIUM', endsAt: '2026-11-29' } }, { interval: 'YEAR' });
    expect(container.querySelector('[data-testid="invite-offer"]').textContent).toContain('First Class or Business at half price');
    expect(cards()[0]).toContain('£41.51 for your first year, then £49 a year.');
    expect(cards()[1]).toContain('£84.01 for your first year, then £99 a year.');
  });

  it('prefers the promo code’s free month to the invite offer', () => {
    const { container } = open({ ...FREE, promoTrial: { code: 'SAMTRAVELS', days: 30 }, inviteOffer: { plan: 'PREMIUM', endsAt: '2026-11-29' } });
    expect(container.querySelector('[data-testid="promo-trial"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="invite-offer"]')).toBeNull();
  });

  it('gives a subscription neither offer', () => {
    const { container } = open({ ...PAYING, promoTrial: { code: 'SAMTRAVELS', days: 30 }, inviteOffer: { plan: 'PREMIUM', endsAt: '2026-11-29' } });
    expect(container.querySelector('[data-testid="promo-trial"]')).toBeNull();
    expect(container.querySelector('[data-testid="invite-offer"]')).toBeNull();
  });

  it('changes a subscription in place: the other plans, and its own on the other interval', () => {
    const { cards, onChoose } = open(PAYING, { interval: 'YEAR' });
    expect(cards().length).toBe(2);
    fireEvent.click(screen.getByText('Pay yearly instead'));
    expect(onChoose).toHaveBeenCalledWith('REGULAR');
    expect(screen.getByText('Upgrade to First Class')).toBeTruthy();
    expect(screen.getByText(/Stripe adjusts your next payment for the time left on this one./)).toBeTruthy();
  });

  it('doesn’t offer a subscription its own plan on its own interval', () => {
    const { cards } = open(PAYING);
    expect(cards().length).toBe(1);
    expect(screen.queryByText('Pay monthly instead')).toBeNull();
  });

  it('calls a lower plan a change, not an upgrade', () => {
    open({ ...PAYING, plan: 'PREMIUM' });
    expect(screen.getByText('Change to Business')).toBeTruthy();
  });

  it('locks the buttons while payments aren’t set up, or busy', () => {
    const { rerender } = open({ ...FREE, paymentsEnabled: false });
    expect(screen.getByText('Upgrade to Business').disabled).toBe(true);
    rerender(
      <MemoryRouter>
        <PlanChoices billing={FREE} interval='MONTH' busy onChoose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Upgrade to Business').getAttribute('aria-busy')).toBe('true');
  });
});
