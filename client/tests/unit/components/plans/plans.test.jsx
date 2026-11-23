import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ExtraMapDialog from '@/components/plans/ExtraMapDialog';
import IntervalPicker from '@/components/plans/IntervalPicker';
import LockedMapNote from '@/components/plans/LockedMapNote';
import PlanUpgradeLink from '@/components/plans/PlanUpgradeLink';
import { getBilling, setExtraMaps } from '@/api/plansApi';
import { goToUrl } from '@/utils/plans/billing';
import { PLANS, formatPence } from '@/utils/constants/plans';
import { renderPage, signedIn } from '../../pages/renderPage';

vi.mock('@/api/plansApi', () => ({ getBilling: vi.fn(), setExtraMaps: vi.fn() }));
vi.mock('@/utils/plans/billing', async (importOriginal) => ({ ...(await importOriginal()), goToUrl: vi.fn() }));

const billing = (over = {}) => ({ plan: 'REGULAR', status: null, interval: null, extraMapsPaid: 0, paymentsEnabled: true, ...over });
const dialog = () => document.querySelector('[role="dialog"]');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IntervalPicker', () => {
  it('offers monthly and yearly with their prices, and reports the choice', () => {
    const onChange = vi.fn();
    const { container } = render(<IntervalPicker name='pay' value='MONTH' onChange={onChange} prices={{ MONTH: 399, YEAR: 3900 }} />);
    expect(container.querySelector('legend').textContent).toBe('How do you want to pay?');
    const [month, year] = container.querySelectorAll('input[type="radio"]');
    expect(month.checked).toBe(true);
    expect(year.checked).toBe(false);
    expect(container.textContent).toContain(`${formatPence(399)} a month`);
    expect(container.textContent).toContain(`${formatPence(3900)} a year`);
    expect(container.textContent).toContain('Two months free');
    fireEvent.click(year);
    expect(onChange).toHaveBeenCalledWith('YEAR');
  });

  it('can be turned off, and leaves out prices it isn’t given', () => {
    const { container } = render(<IntervalPicker name='pay' value='YEAR' onChange={() => {}} legend='Pay for it' disabled />);
    expect(container.querySelector('fieldset').disabled).toBe(true);
    expect(container.querySelector('legend').textContent).toBe('Pay for it');
    expect(container.textContent).not.toContain('a month');
  });
});

describe('LockedMapNote and PlanUpgradeLink', () => {
  it('tells the owner how to unlock the map, anyone else who can', () => {
    expect(render(<LockedMapNote isOwner />).container.textContent).toContain('Pay for it on the map’s page');
    expect(render(<LockedMapNote />).container.textContent).toContain('Its owner can pay for it as an extra map.');
  });

  it('sends the owner to their account, anyone else to the plans', () => {
    const owner = renderPage(<PlanUpgradeLink isOwner />);
    expect(owner.container.querySelector('a').textContent).toBe('Upgrade your plan');
    expect(owner.container.querySelector('a').getAttribute('href')).toBe('/account');
    owner.unmount();
    const other = renderPage(<PlanUpgradeLink />);
    expect(other.container.textContent).toContain('The map’s owner can upgrade its plan.');
    expect(other.container.querySelector('a').getAttribute('href')).toBe('/pricing');
  });
});

describe('ExtraMapDialog', () => {
  const open = (props = {}) => renderPage(<ExtraMapDialog onClose={vi.fn()} {...props} />, { auth: signedIn() });

  it('shows a spinner while the plan loads, then the extra map’s price from the constants', async () => {
    let answer;
    getBilling.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    open();
    expect(dialog().querySelector('[role="status"]').textContent).toContain('Loading your plan…');
    answer(billing());
    await waitFor(() => expect(dialog().textContent).toContain('You have your 3 free maps.'));
    expect(dialog().textContent).toContain(`An extra map is ${formatPence(PLANS.REGULAR.extraMap.MONTH)} a month`);
    expect(dialog().textContent).toContain(`${PLANS.REGULAR.limits.photosPerCountry.toLocaleString('en-GB')} photos of`);
    expect(dialog().textContent).toContain('Pay for another map');
  });

  it('titles itself for a locked map and for an upgrade', async () => {
    getBilling.mockResolvedValue(billing({ extraMapsPaid: 2 }));
    const locked = open({ reason: 'locked' });
    await waitFor(() => expect(dialog().textContent).toContain('This map isn’t paid for'));
    expect(dialog().textContent).toContain('Pay for this map');
    locked.unmount();
    open({ reason: 'upgrade' });
    await waitFor(() => expect(dialog().textContent).toContain(`moves from Economy onto your ${PLANS.REGULAR.name} plan`));
    expect(dialog().textContent).toContain('Upgrade this map');
  });

  it('with no subscription: chooses monthly or yearly, then goes to Checkout, keeping the waiting map', async () => {
    getBilling.mockResolvedValue(billing());
    setExtraMaps.mockResolvedValue({ url: 'https://checkout.example/session' });
    open({ pendingMap: { name: 'The Smiths' } });
    await waitFor(() => expect(screen.getByText('Go to checkout')).toBeTruthy());
    fireEvent.click(dialog().querySelectorAll('input[type="radio"]')[1]);
    fireEvent.click(screen.getByText('Go to checkout'));
    await waitFor(() => expect(goToUrl).toHaveBeenCalledWith('https://checkout.example/session'));
    expect(setExtraMaps).toHaveBeenCalledWith({ quantity: 1, interval: 'YEAR' });
    expect(JSON.parse(sessionStorage.getItem('mpv:pendingNewMap'))).toMatchObject({ userId: 'user-1', body: { name: 'The Smiths' } });
  });

  it('with a subscription: adds it to the payment at once and hands back the new billing', async () => {
    getBilling.mockResolvedValue(billing({ status: 'active', interval: 'YEAR', extraMapsPaid: 1 }));
    setExtraMaps.mockResolvedValue({ billing: billing({ status: 'active', extraMapsPaid: 2 }) });
    const onPaid = vi.fn();
    open({ onPaid });
    const pay = await screen.findByText(`Pay ${formatPence(PLANS.REGULAR.extraMap.YEAR)} a year`);
    expect(dialog().textContent).toContain('It’s added to your yearly payment');
    expect(dialog().querySelector('input[type="radio"]')).toBeNull();
    expect(dialog().textContent).toContain('the 1 extra map you pay for is in use');
    fireEvent.click(pay);
    await waitFor(() => expect(onPaid).toHaveBeenCalledWith(expect.objectContaining({ extraMapsPaid: 2 })));
    expect(setExtraMaps).toHaveBeenCalledWith({ quantity: 2, interval: undefined });
    expect(goToUrl).not.toHaveBeenCalled();
  });

  it('says when payments aren’t set up, with only a Close button', async () => {
    getBilling.mockResolvedValue(billing({ paymentsEnabled: false }));
    const onClose = vi.fn();
    open({ onClose });
    await waitFor(() => expect(dialog().textContent).toContain('Payments aren’t set up yet.'));
    expect(screen.queryByText('Go to checkout')).toBeNull();
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows why the plan or the payment failed', async () => {
    getBilling.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Billing is down.' }));
    const first = open();
    expect(await screen.findByText('Billing is down.')).toBeTruthy();
    expect(dialog().querySelector('[role="status"]')).toBeNull();
    first.unmount();
    getBilling.mockResolvedValue(billing());
    setExtraMaps.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Card refused.' }));
    open();
    fireEvent.click(await screen.findByText('Go to checkout'));
    expect(await screen.findByText('Card refused.')).toBeTruthy();
    expect(screen.getByText('Go to checkout').closest('button').disabled).toBe(false);
  });
});
