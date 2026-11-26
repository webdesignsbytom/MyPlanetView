import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminGiftsMainContainer from '@/components/admin/gifts/AdminGiftsMainContainer';
import GiftAdminItem from '@/components/admin/gifts/GiftAdminItem';
import { getAdminGifts, getAdminReferrals } from '@/api/adminApi';

vi.mock('@/api/adminApi', () => ({ getAdminGifts: vi.fn(), getAdminReferrals: vi.fn() }));

const GIFT = {
  id: 'g1',
  code: 'GFT2-AD3M-N4QR',
  plan: 'REGULAR',
  planName: 'Business',
  months: 12,
  amountPence: 4900,
  currency: 'gbp',
  status: 'REDEEMED',
  toName: 'Gran',
  createdAt: '2026-11-01T10:00:00.000Z',
  paidAt: '2026-11-01T10:05:00.000Z',
  redeemedAt: '2026-11-02T09:00:00.000Z',
  refundedAt: null,
  buyer: { name: 'Bea', email: 'bea@example.test' },
  redeemedBy: { name: 'Pat', email: 'pat@example.test' },
  grant: { startsAt: '2026-11-02T09:00:00.000Z', endsAt: '2027-11-02T09:00:00.000Z' },
};
const READY = { ...GIFT, id: 'g2', code: 'ABCD-EFGH-JKMN', status: 'READY', redeemedAt: null, redeemedBy: null, grant: null, toName: null };
const REWARD = {
  id: 'r1',
  kind: 'CREDIT',
  amountPence: 499,
  createdAt: '2026-11-20T00:00:00.000Z',
  appliedAt: null,
  referrer: { name: 'Sam', email: 'sam@example.test' },
  friend: { name: 'Jo' },
  grant: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  getAdminGifts.mockImplementation(({ code } = {}) => Promise.resolve({ gifts: code ? (code.toUpperCase().includes('GFT2') ? [GIFT] : []) : [GIFT, READY] }));
  getAdminReferrals.mockResolvedValue({ rewards: [REWARD] });
});

describe('GiftAdminItem', () => {
  it('shows the code, what it is, its state and who bought and redeemed it', () => {
    const { container } = render(<GiftAdminItem gift={GIFT} />);
    const text = container.textContent;
    expect(text).toContain('GFT2-AD3M-N4QR');
    expect(text).toContain('A year of Business, £49');
    expect(text).toContain('Redeemed');
    expect(text).toContain('Bea (bea@example.test), for Gran');
    expect(text).toContain('Pat (pat@example.test), 2 Nov 2026, 09:00 UTC; the plan runs until 2 Nov 2027, 09:00 UTC');
    expect(container.querySelector('a[href="mailto:bea@example.test"]')).not.toBeNull();
  });

  it('a gift not redeemed, from an account since deleted', () => {
    const { container } = render(<GiftAdminItem gift={{ ...READY, buyer: null }} />);
    expect(container.textContent).toContain('Paid, not redeemed yet');
    expect(container.textContent).toContain('an account since deleted');
    expect(container.textContent).not.toContain('Redeemed by');
  });
});

describe('AdminGiftsMainContainer', () => {
  it('lists the gifts bought lately and the referral rewards', async () => {
    const { container } = render(<AdminGiftsMainContainer />);
    await waitFor(() => expect(container.querySelectorAll('[aria-label="Gifts bought lately"] [data-admin-gift]')).toHaveLength(2));
    const reward = container.querySelector('[data-admin-reward="CREDIT"]');
    expect(reward.textContent).toContain('Sam (sam@example.test), for Jo: £4.99 off their bill');
  });

  it('finds a gift by its code, says when none has it, and asks for a code first', async () => {
    const { container } = render(<AdminGiftsMainContainer />);
    const input = screen.getByLabelText(/^Gift code/);
    const form = input.closest('form');

    fireEvent.submit(form);
    expect((await screen.findByRole('alert')).textContent).toBe('Type the gift’s code, as XXXX-XXXX-XXXX.');
    expect(getAdminGifts).not.toHaveBeenCalledWith({ code: '' });

    fireEvent.change(input, { target: { value: 'gft2-ad3m-n4qr' } });
    fireEvent.submit(form);
    await waitFor(() => expect(container.querySelector('[aria-label="The gift found"] [data-admin-gift="GFT2-AD3M-N4QR"]')).not.toBeNull());
    expect(getAdminGifts).toHaveBeenCalledWith({ code: 'gft2-ad3m-n4qr' });

    fireEvent.change(input, { target: { value: '2222-3333-4444' } });
    fireEvent.submit(form);
    await waitFor(() => expect(container.querySelector('[aria-label="The gift found"]').textContent).toBe('No gift has that code.'));
  });

  it('says what the server said when a code can’t be one', async () => {
    getAdminGifts.mockImplementation(({ code } = {}) =>
      code ? Promise.reject({ friendlyMessage: 'That gift code doesn’t exist. Check it and try again.' }) : Promise.resolve({ gifts: [] }),
    );
    render(<AdminGiftsMainContainer />);
    expect(await screen.findByText('No gifts bought yet.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Gift code/), { target: { value: '!!' } });
    fireEvent.submit(screen.getByLabelText(/^Gift code/).closest('form'));
    expect((await screen.findByRole('alert')).textContent).toBe('That gift code doesn’t exist. Check it and try again.');
  });
});
