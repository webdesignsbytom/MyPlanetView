import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import GiftPage from '@/pages/gifts/GiftPage';
import GiftsPage from '@/pages/gifts/GiftsPage';
import { getGift, getMyGifts, redeemGift } from '@/api/giftsApi';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import { GIFT_PAGE_URL, GIFTS_PAGE_URL } from '@/utils/constants/routes';
import { PLANS } from '@/utils/constants/plans';
import { authValue, elsewhere, headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/giftsApi', () => ({ getGift: vi.fn(), getMyGifts: vi.fn(), redeemGift: vi.fn(), startGiftCheckout: vi.fn() }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));

const CODE = 'AAAA-BBBB-CCCC';
const AT = `/gift/${CODE}`;
const gift = (over = {}) => ({ code: CODE, status: 'READY', plan: 'PREMIUM', planName: PLANS.PREMIUM.name, months: 12, toName: 'Gigie', fromName: 'Tom', message: 'Happy birthday!', ...over });
const failure = (message) => Object.assign(new Error('x'), { friendlyMessage: message });

beforeEach(() => {
  vi.clearAllMocks();
  useMustVerifyEmail.mockReturnValue(false);
});

describe('GiftPage', () => {
  const open = (auth = signedIn()) => renderPage(<GiftPage />, { path: GIFT_PAGE_URL, at: AT, auth });

  it('opens the gift with a loading state, then its title, who it’s for and from, and the message', async () => {
    getGift.mockResolvedValue({ gift: gift() });
    open();
    expect(onlyMain().count).toBe(1);
    expect(onlyMain().id).toBe('main-content');
    expect(headings()).toEqual(['A gift']);
    expect(document.querySelector('main [role="status"]').textContent).toContain('Opening the gift…');
    await waitFor(() => expect(headings()).toEqual([`A year of ${PLANS.PREMIUM.name}`]));
    expect(getGift).toHaveBeenCalledWith(CODE);
    const main = onlyMain().main;
    expect(main.getAttribute('aria-labelledby')).toBe('gift-heading');
    expect(main.querySelector('[data-gift-status]').getAttribute('data-gift-status')).toBe('READY');
    expect(main.textContent).toContain('ForGigie');
    expect(main.textContent).toContain('FromTom');
    expect(main.textContent).toContain('“Happy birthday!”');
    expect(main.textContent).toContain('every photo and video');
  });

  it('signed out: sends to sign up or sign in, and back here after', async () => {
    getGift.mockResolvedValue({ gift: gift() });
    open(authValue());
    await waitFor(() => expect(screen.getByText('Create an account')).toBeTruthy());
    expect(screen.queryByText('Redeem the gift')).toBeNull();
    fireEvent.click(screen.getByText('Create an account'));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe('/sign-up');
    expect(elsewhere().getAttribute('data-from')).toBe(AT);
  });

  it('signed out, sign in carries the gift’s address too', async () => {
    getGift.mockResolvedValue({ gift: gift() });
    open(authValue());
    fireEvent.click(await screen.findByText('Sign in'));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe('/login');
    expect(elsewhere().getAttribute('data-from')).toBe(AT);
  });

  it('while the session is read, offers nothing yet', async () => {
    getGift.mockResolvedValue({ gift: gift() });
    open(authValue({ loading: true }));
    await waitFor(() => expect(headings()).toEqual([`A year of ${PLANS.PREMIUM.name}`]));
    expect(screen.queryByText('Create an account')).toBeNull();
    expect(screen.queryByText('Redeem the gift')).toBeNull();
  });

  it('unverified: says to verify first', async () => {
    useMustVerifyEmail.mockReturnValue(true);
    getGift.mockResolvedValue({ gift: gift() });
    open();
    expect(await screen.findByText(/Verify your email address to redeem it/)).toBeTruthy();
    expect(screen.queryByText('Redeem the gift')).toBeNull();
  });

  it('redeems it, then links to the map and the plan', async () => {
    getGift.mockResolvedValue({ gift: gift() });
    redeemGift.mockResolvedValue({ grant: { planName: PLANS.PREMIUM.name, endsAt: '2027-11-22T00:00:00Z' } });
    open();
    fireEvent.click(await screen.findByText('Redeem the gift'));
    expect(await screen.findByText(new RegExp(`It’s yours: ${PLANS.PREMIUM.name} until .*2027`))).toBeTruthy();
    expect(redeemGift).toHaveBeenCalledWith(CODE);
    expect(screen.getByText('Open your map').getAttribute('href')).toBe('/map');
    expect(screen.getByText('See your plan').getAttribute('href')).toBe('/account');
  });

  it('says why redeeming failed', async () => {
    getGift.mockResolvedValue({ gift: gift() });
    redeemGift.mockRejectedValue(failure('You already pay for First Class.'));
    open();
    fireEvent.click(await screen.findByText('Redeem the gift'));
    expect(await screen.findByText('You already pay for First Class.')).toBeTruthy();
  });

  it('a redeemed or refunded gift can’t be redeemed', async () => {
    getGift.mockResolvedValue({ gift: gift({ status: 'REDEEMED' }) });
    const first = open();
    expect(await screen.findByText('This gift has been redeemed.')).toBeTruthy();
    first.unmount();
    getGift.mockResolvedValue({ gift: gift({ status: 'REFUNDED', plan: 'REGULAR', message: null, toName: null, fromName: null }) });
    open();
    expect(await screen.findByText('This gift was refunded, so it can’t be redeemed.')).toBeTruthy();
    expect(screen.queryByText('Redeem the gift')).toBeNull();
    expect(document.querySelector('blockquote')).toBeNull();
  });

  it('an unknown code says so and keeps an h1', async () => {
    getGift.mockRejectedValue(failure('No gift has that code.'));
    open();
    expect(await screen.findByText('No gift has that code.')).toBeTruthy();
    expect(headings()).toEqual(['A gift']);
    expect(document.querySelector('main [role="status"]')).toBeNull();
  });
});

describe('GiftsPage', () => {
  const OFFERS = [
    { plan: 'REGULAR', planName: PLANS.REGULAR.name, months: 12, pence: PLANS.REGULAR.price.YEAR },
    { plan: 'PREMIUM', planName: PLANS.PREMIUM.name, months: 12, pence: PLANS.PREMIUM.price.YEAR },
  ];
  const open = (at = GIFTS_PAGE_URL) => renderPage(<GiftsPage />, { path: GIFTS_PAGE_URL, at, auth: signedIn() });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has one main and its h1, a loading state, then the buy card and the list', async () => {
    getMyGifts.mockResolvedValue({ offers: OFFERS, gifts: [], paymentsEnabled: true });
    open();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('gifts-page-heading');
    expect(headings()).toEqual(['Give a year of travel']);
    expect(main.querySelector('[role="status"]').textContent).toContain('Loading your gifts…');
    expect(await screen.findByText('Choose the gift')).toBeTruthy();
    expect(screen.getByText('None yet. Gifts you buy show here, with their codes.')).toBeTruthy();
  });

  it('with no offers, shows only the list', async () => {
    getMyGifts.mockResolvedValue({ offers: [], gifts: [] });
    open();
    expect(await screen.findByText('Your gifts')).toBeTruthy();
    expect(screen.queryByText('Choose the gift')).toBeNull();
  });

  it('shows why the gifts couldn’t be loaded', async () => {
    getMyGifts.mockRejectedValue(failure('Gifts are resting.'));
    open();
    expect(await screen.findByText('Gifts are resting.')).toBeTruthy();
  });

  it('back from Checkout: thanks them and reads the list again after 3 s and 8 s', async () => {
    vi.useFakeTimers();
    getMyGifts.mockResolvedValue({ offers: OFFERS, gifts: [], paymentsEnabled: true });
    open(`${GIFTS_PAGE_URL}?bought=1`);
    expect(screen.getByText(/Thank you\. Your gift is below/)).toBeTruthy();
    expect(getMyGifts).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(3000));
    expect(getMyGifts).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTime(5000));
    expect(getMyGifts).toHaveBeenCalledTimes(3);
  });

  it('a cancelled Checkout says no payment was taken', async () => {
    getMyGifts.mockResolvedValue({ offers: OFFERS, gifts: [] });
    open(`${GIFTS_PAGE_URL}?cancelled=1`);
    expect(screen.getByText('No payment was taken.')).toBeTruthy();
    await waitFor(() => expect(getMyGifts).toHaveBeenCalledTimes(1));
  });
});
