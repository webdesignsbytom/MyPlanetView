import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ExtraMapsSummary from '@/components/account/ExtraMapsSummary';

const FREE = {
  plan: 'FREE',
  status: null,
  interval: null,
  paymentsEnabled: true,
  ownedMaps: 2,
  includedMaps: 1,
  freeEconomyMaps: 2,
  economyMapIds: ['m2'],
  lockedMapIds: [],
  extraMapsPaid: 0,
};

const open = (billing, props = {}) => {
  const onAdd = vi.fn();
  const onRemoveUnused = vi.fn();
  const view = render(
    <ExtraMapsSummary billing={{ ...FREE, ...billing }} interval='MONTH' onAdd={onAdd} onRemoveUnused={onRemoveUnused} {...props} />,
  );
  const section = view.container.querySelector('section');
  return { onAdd, onRemoveUnused, section, ...view };
};

describe('ExtraMapsSummary', () => {
  it('counts the maps owned against the three free ones', () => {
    const { section } = open({});
    expect(section.getAttribute('aria-labelledby')).toBe('extra-maps-heading');
    expect(section.textContent).toContain(
      'You own 2 maps. You have 3 free maps: your main one on your plan, and 2 more on Economy (1 in use). You pay for 0 extra maps, each one more map on your plan.',
    );
    expect(section.textContent).toContain('An extra map is £3.99 a month or £39 a year. Maps other people share with you are always free.');
  });

  it('says how many extra maps are in use', () => {
    const { section } = open({ ownedMaps: 5, economyMapIds: ['a', 'b'], extraMapsPaid: 3 });
    // 5 owned − 1 main − 2 Economy = 2 extra in use
    expect(section.textContent).toContain('You pay for 3 extra maps (2 in use)');
  });

  it('names a locked map, and keeps its photos', () => {
    const { section } = open({ ownedMaps: 4, economyMapIds: ['a', 'b'], lockedMapIds: ['c'] }, { lockedNames: ['Old trips'] });
    expect(section.textContent).toContain('One of your maps isn’t paid for, so it can’t take new photos: “Old trips”. Nothing on it is deleted.');
  });

  it('counts several locked maps', () => {
    const { section } = open({ ownedMaps: 5, economyMapIds: ['a', 'b'], lockedMapIds: ['c', 'd'] });
    expect(section.textContent).toContain('2 of your maps aren’t paid for, so they can’t take new photos. Nothing on them is deleted.');
  });

  it('without a subscription, prices the extra map on the interval chosen above', () => {
    const { section, rerender } = open({});
    expect(section.textContent).toContain('£3.99 a month, paid monthly (chosen above) on Stripe’s secure checkout.');
    rerender(<ExtraMapsSummary billing={FREE} interval='YEAR' onAdd={vi.fn()} onRemoveUnused={vi.fn()} />);
    expect(section.textContent).toContain('£39 a year, paid yearly (chosen above) on Stripe’s secure checkout.');
  });

  it('with a subscription, prices it on the plan and the subscription’s interval', () => {
    const { section } = open({ plan: 'PREMIUM', status: 'active', interval: 'YEAR' }, { interval: 'MONTH' });
    expect(section.textContent).toContain('£59 a year, on your yearly payment and adjusted for the time left.');
    expect(section.textContent).toContain('An extra map is £5.99 a month or £59 a year.');
  });

  it('uses the server’s prices when it sends them', () => {
    const { section } = open({ prices: { extraMap: { FREE: { MONTH: 450, YEAR: 4500 } } } });
    expect(section.textContent).toContain('An extra map is £4.50 a month or £45 a year.');
  });

  it('adds an extra map', () => {
    const { onAdd } = open({});
    fireEvent.click(screen.getByText('Add an extra map'));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Drop an unused one')).toBeNull();
  });

  it('offers to drop an unused extra map on a subscription', () => {
    const { onRemoveUnused, section } = open({ plan: 'REGULAR', status: 'active', interval: 'MONTH', ownedMaps: 1, economyMapIds: [], extraMapsPaid: 1 });
    expect(section.textContent).toContain('You pay for 1 extra map you aren’t using.');
    fireEvent.click(screen.getByText('Drop an unused one'));
    expect(onRemoveUnused).toHaveBeenCalledTimes(1);
  });

  it('waits for a promo code’s free month to end before adding maps', () => {
    open({ plan: 'REGULAR', status: 'trialing', interval: 'MONTH' });
    expect(screen.getByText('Add an extra map').disabled).toBe(true);
    expect(screen.getByText('Extra maps can be added once your free month ends.')).toBeTruthy();
  });

  it('is locked while payments aren’t set up, or busy', () => {
    const { rerender } = open({ paymentsEnabled: false });
    expect(screen.getByText('Add an extra map').disabled).toBe(true);
    rerender(<ExtraMapsSummary billing={FREE} interval='MONTH' busy onAdd={vi.fn()} onRemoveUnused={vi.fn()} />);
    const button = screen.getByText('Add an extra map');
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});
