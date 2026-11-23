import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GiftBuyCard from '@/components/gifts/GiftBuyCard';
import GiftListCard from '@/components/gifts/GiftListCard';
import { startGiftCheckout } from '@/api/giftsApi';
import { PLANS, formatPence } from '@/utils/constants/plans';

vi.mock('@/api/giftsApi', () => ({ startGiftCheckout: vi.fn() }));

const OFFERS = [
  { plan: 'REGULAR', planName: PLANS.REGULAR.name, months: 12, pence: PLANS.REGULAR.price.YEAR },
  { plan: 'PREMIUM', planName: PLANS.PREMIUM.name, months: 12, pence: PLANS.PREMIUM.price.YEAR },
];

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  window.location.hash = '';
});

describe('GiftBuyCard', () => {
  it('offers each plan’s year at its price, First Class chosen first', () => {
    const { container } = render(<GiftBuyCard offers={OFFERS} paymentsEnabled locked={false} />);
    const radios = [...container.querySelectorAll('input[type="radio"]')];
    expect(radios.map((r) => [r.value, r.checked])).toEqual([
      ['REGULAR', false],
      ['PREMIUM', true],
    ]);
    expect(container.textContent).toContain(`A year of ${PLANS.REGULAR.name}`);
    expect(container.textContent).toContain(`${formatPence(PLANS.PREMIUM.price.YEAR)}, paid once`);
    expect(screen.getByText(`Pay ${formatPence(PLANS.PREMIUM.price.YEAR)} for the gift`)).toBeTruthy();
    fireEvent.click(radios[0]);
    expect(screen.getByText(`Pay ${formatPence(PLANS.REGULAR.price.YEAR)} for the gift`)).toBeTruthy();
  });

  it('goes to Checkout with the plan, a trimmed name and message, or nulls', async () => {
    startGiftCheckout.mockResolvedValue({ url: '#gift-checkout' });
    const { container } = render(<GiftBuyCard offers={OFFERS} paymentsEnabled locked={false} />);
    fireEvent.change(screen.getByLabelText(/Who it’s for/), { target: { value: '  Gigie ' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(window.location.hash).toBe('#gift-checkout'));
    expect(startGiftCheckout).toHaveBeenCalledWith({ plan: 'PREMIUM', toName: 'Gigie', message: null });
  });

  it('says why Checkout couldn’t open', async () => {
    startGiftCheckout.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Payments are paused.' }));
    const { container } = render(<GiftBuyCard offers={OFFERS} paymentsEnabled locked={false} />);
    fireEvent.change(screen.getByLabelText(/A few words on the gift/), { target: { value: 'Happy birthday!' } });
    fireEvent.submit(container.querySelector('form'));
    expect(await screen.findByText('Payments are paused.')).toBeTruthy();
    expect(startGiftCheckout).toHaveBeenCalledWith({ plan: 'PREMIUM', toName: null, message: 'Happy birthday!' });
  });

  it('unverified or with payments off: says so instead of a pay button', () => {
    const locked = render(<GiftBuyCard offers={OFFERS} paymentsEnabled locked />);
    expect(locked.container.textContent).toContain('Verify your email address to buy a gift.');
    expect(screen.queryByText(/for the gift$/)).toBeNull();
    locked.unmount();
    const off = render(<GiftBuyCard offers={OFFERS} paymentsEnabled={false} locked={false} />);
    expect(off.container.textContent).toContain('Payments aren’t switched on yet');
    expect(screen.queryByText(/for the gift$/)).toBeNull();
  });
});

describe('GiftListCard', () => {
  const GIFTS = [
    { id: 'g1', code: 'AAAA-BBBB-CCCC', status: 'READY', planName: PLANS.PREMIUM.name, months: 12, toName: 'Gigie', paidAt: '2026-11-20T10:00:00Z' },
    { id: 'g2', code: 'DDDD-EEEE-FFFF', status: 'REDEEMED', planName: PLANS.REGULAR.name, months: 6, paidAt: '2026-10-01T10:00:00Z', redeemedAt: '2026-10-05T10:00:00Z' },
  ];
  const inRouter = (element) => render(<MemoryRouter>{element}</MemoryRouter>);

  it('lists each gift with its title, code and where it stands', () => {
    const { container } = inRouter(<GiftListCard gifts={GIFTS} />);
    const ready = container.querySelector('[data-gift-code="AAAA-BBBB-CCCC"]');
    expect(ready.textContent).toContain(`A year of ${PLANS.PREMIUM.name} for Gigie`);
    expect(ready.textContent).toContain('Ready to give · bought');
    expect(within(ready).getByText('Open the gift').getAttribute('href')).toBe('/gift/AAAA-BBBB-CCCC');
    const redeemed = container.querySelector('[data-gift-code="DDDD-EEEE-FFFF"]');
    expect(redeemed.textContent).toContain(`6 months of ${PLANS.REGULAR.name}`);
    expect(redeemed.textContent).toMatch(/Redeemed · bought .* · redeemed /);
    // Only a gift still to give has its links
    expect(within(redeemed).queryByText('Open the gift')).toBeNull();
  });

  it('copies a gift’s link', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue() }, configurable: true });
    const { container } = inRouter(<GiftListCard gifts={GIFTS} />);
    fireEvent.click(container.querySelector('button[aria-label="Copy the link to the gift AAAA-BBBB-CCCC"]'));
    expect(await screen.findByText('Link copied')).toBeTruthy();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/gift/AAAA-BBBB-CCCC`);
  });

  it('says when there are none', () => {
    inRouter(<GiftListCard gifts={[]} />);
    expect(screen.getByText('None yet. Gifts you buy show here, with their codes.')).toBeTruthy();
  });
});
