import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import PlanSummary from '@/components/account/PlanSummary';

const FREE = { plan: 'FREE', source: 'NONE', status: null, interval: null, grant: null, renewsAt: null, cancelAtPeriodEnd: false };

const textOf = (billing) => {
  const { container } = render(<PlanSummary billing={{ ...FREE, ...billing }} />);
  return [...container.querySelectorAll('p')].map((p) => p.textContent);
};

describe('PlanSummary', () => {
  it('shows Economy as free, with what it keeps', () => {
    expect(textOf({})).toEqual([
      'Economy',
      'Free',
      'Your plan keeps 30 photos of each country on each map and a print-quality copy of each photo (good up to A4).',
    ]);
  });

  it('shows a paid plan’s price, renewal and limits', () => {
    const lines = textOf({ plan: 'REGULAR', source: 'STRIPE', status: 'active', interval: 'MONTH', renewsAt: '2026-12-05' });
    expect(lines).toEqual([
      'Business',
      'Paid monthly, £4.99 a month',
      'Renews on 5 Dec 2026.',
      'Your plan keeps 200 photos of each country on each map, your full-size originals and up to 50 GB of photos on each map.',
    ]);
  });

  it('prices a yearly plan from the server’s prices when it sends them', () => {
    const lines = textOf({
      plan: 'PREMIUM',
      source: 'STRIPE',
      status: 'active',
      interval: 'YEAR',
      prices: { plans: { PREMIUM: { MONTH: 999, YEAR: 9500 } } },
    });
    expect(lines[1]).toBe('Paid yearly, £95 a year');
    expect(lines.at(-1)).toContain('1,000 photos of each country');
  });

  it('says a promo code’s free month ends with the first payment', () => {
    const lines = textOf({ plan: 'REGULAR', source: 'STRIPE', status: 'trialing', interval: 'MONTH', renewsAt: '2026-12-20' });
    expect(lines).toContain('Free until 20 Dec 2026. Your first payment is then, unless you cancel before.');
  });

  it('says when a cancelled plan stops, in the free month too', () => {
    expect(textOf({ plan: 'REGULAR', source: 'STRIPE', status: 'active', interval: 'MONTH', renewsAt: '2026-12-05', cancelAtPeriodEnd: true })).toContain(
      'Cancelled: it stops on 5 Dec 2026, and nothing is deleted.',
    );
    expect(textOf({ plan: 'REGULAR', source: 'STRIPE', status: 'trialing', interval: 'MONTH', renewsAt: '2026-12-05', cancelAtPeriodEnd: true })).toContain(
      'Cancelled in your free month: it stops on 5 Dec 2026, nothing is charged and nothing is deleted.',
    );
  });

  it('warns about a failed payment', () => {
    const lines = textOf({ plan: 'REGULAR', source: 'STRIPE', status: 'past_due', interval: 'MONTH', renewsAt: '2026-12-05' });
    expect(lines).toContain('Your last payment didn’t go through. Stripe will try again; check your card under Manage billing.');
  });

  it('has no renewal line for an ended subscription', () => {
    const lines = textOf({ status: 'canceled', renewsAt: '2026-12-05' });
    expect(lines.some((line) => line.includes('Renews'))).toBe(false);
  });

  it('shows a complimentary membership with its end date', () => {
    const lines = textOf({ plan: 'REGULAR', source: 'COMPLIMENTARY', grant: { plan: 'REGULAR', endsAt: '2027-03-01T00:00:00.000Z' } });
    expect(lines[0]).toBe('Business');
    expect(lines[1]).toBe('Complimentary Business until 1 Mar 2027');
  });

  it('shows a membership for life as "for life"', () => {
    const lines = textOf({ plan: 'PREMIUM', source: 'COMPLIMENTARY', grant: { plan: 'PREMIUM', endsAt: '9999-12-31T00:00:00.000Z' } });
    expect(lines[1]).toBe('Complimentary First Class for life');
  });

  it('mentions a membership running beside a subscription that wins', () => {
    const lines = textOf({
      plan: 'PREMIUM',
      source: 'STRIPE',
      status: 'active',
      interval: 'MONTH',
      grant: { plan: 'REGULAR', endsAt: '2027-01-01T00:00:00.000Z' },
    });
    expect(lines).toContain('You also have complimentary Business until 1 Jan 2027.');
  });

  it('mentions a subscription carrying on beside a membership that wins', () => {
    const lines = textOf({
      plan: 'PREMIUM',
      source: 'COMPLIMENTARY',
      status: 'active',
      interval: 'MONTH',
      renewsAt: '2026-12-05',
      grant: { plan: 'PREMIUM', endsAt: '9999-12-31T00:00:00.000Z' },
    });
    expect(lines).toContain('Your subscription carries on beside it, and renews on 5 Dec 2026.');
  });
});
