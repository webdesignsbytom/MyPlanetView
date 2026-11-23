import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccountPlanSection from '@/components/account/AccountPlanSection';
import { AuthContext } from '@/auth/AuthContext';
import { changePlan, getBilling, openBillingPortal, setExtraMaps, startCheckout } from '@/api/plansApi';
import { createMap } from '@/api/travelApi';
import { forgetMapLists, myMaps } from '@/utils/map/mapListCache';
import { goToUrl, readPendingMap, savePendingMap } from '@/utils/plans/billing';
import { mapPath } from '@/utils/constants/routes';

vi.mock('@/api/plansApi', () => ({
  changePlan: vi.fn(),
  getBilling: vi.fn(),
  openBillingPortal: vi.fn(),
  setExtraMaps: vi.fn(),
  startCheckout: vi.fn(),
}));
vi.mock('@/api/travelApi', () => ({ createMap: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn(), myMaps: { load: vi.fn() } }));
vi.mock('@/utils/plans/billing', async (importOriginal) => ({ ...(await importOriginal()), goToUrl: vi.fn() }));
// The cards it holds have their own tests: stand-ins that hand back their choices
vi.mock('@/components/account/PlanSummary', () => ({ default: ({ billing }) => <p data-plan-summary>{billing.plan}</p> }));
vi.mock('@/components/account/PlanChoices', () => ({
  default: ({ onChoose, interval, busy }) => (
    <button type='button' data-choose-plan={interval} disabled={busy} onClick={() => onChoose('PREMIUM')}>
      Choose First Class
    </button>
  ),
}));
vi.mock('@/components/account/ExtraMapsSummary', () => ({
  default: ({ onAdd, onRemoveUnused, lockedNames }) => (
    <div data-extra-maps={lockedNames.join('|')}>
      <button type='button' onClick={onAdd}>
        Add an extra map
      </button>
      <button type='button' onClick={onRemoveUnused}>
        Stop paying for one
      </button>
    </div>
  ),
}));
vi.mock('@/components/plans/IntervalPicker', () => ({
  default: ({ value, onChange }) => (
    <button type='button' data-interval={value} onClick={() => onChange('YEAR')}>
      Yearly
    </button>
  ),
}));

const BASE = { plan: 'FREE', paymentsEnabled: true, extraMapsPaid: 0, status: null, interval: null, lockedMapIds: [] };
const USER = { id: 'u1', email: 'sam@example.com' };

const open = (search = '') =>
  render(
    <AuthContext.Provider value={{ user: USER }}>
      <MemoryRouter initialEntries={[`/account${search}`]}>
        <AccountPlanSection />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

beforeEach(() => {
  for (const fn of [changePlan, getBilling, openBillingPortal, setExtraMaps, startCheckout, createMap, forgetMapLists, myMaps.load, goToUrl]) fn.mockReset();
  myMaps.load.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AccountPlanSection', () => {
  it('says it’s loading, then shows the plan', async () => {
    let resolve;
    getBilling.mockReturnValue(new Promise((r) => (resolve = r)));
    open();
    expect(screen.getByText('Loading your plan…')).toBeTruthy();
    await act(async () => resolve({ ...BASE, plan: 'REGULAR' }));
    expect(document.querySelector('[data-plan-summary]').textContent).toBe('REGULAR');
    expect(screen.queryByText('Loading your plan…')).toBeNull();
  });

  it('says why when the plan can’t be loaded', async () => {
    getBilling.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'The server is down.' }));
    open();
    expect((await screen.findByText('The server is down.')).getAttribute('role')).toBe('alert');
  });

  it('with no subscription, a plan goes to Stripe’s Checkout at the interval chosen', async () => {
    getBilling.mockResolvedValue(BASE);
    startCheckout.mockResolvedValue({ url: 'https://checkout.stripe.test/s1' });
    open();
    await screen.findByText('Choose First Class');
    fireEvent.click(screen.getByText('Yearly'));
    expect(document.querySelector('[data-choose-plan]').getAttribute('data-choose-plan')).toBe('YEAR');
    await act(async () => fireEvent.click(screen.getByText('Choose First Class')));
    expect(startCheckout).toHaveBeenCalledWith({ plan: 'PREMIUM', interval: 'YEAR' });
    expect(changePlan).not.toHaveBeenCalled();
    expect(goToUrl).toHaveBeenCalledWith('https://checkout.stripe.test/s1');
    // still busy while the browser leaves
    expect(document.querySelector('[data-choose-plan]').disabled).toBe(true);
  });

  it('with a subscription, changes the plan in place and says so', async () => {
    getBilling.mockResolvedValue({ ...BASE, plan: 'REGULAR', status: 'active', interval: 'MONTH' });
    changePlan.mockResolvedValue({ billing: { ...BASE, plan: 'PREMIUM', status: 'active', interval: 'MONTH' } });
    open();
    await screen.findByText('Choose First Class');
    await act(async () => fireEvent.click(screen.getByText('Choose First Class')));
    expect(changePlan).toHaveBeenCalledWith({ plan: 'PREMIUM', interval: 'MONTH' });
    expect(startCheckout).not.toHaveBeenCalled();
    expect(screen.getByText('Done: you’re on First Class, paid monthly.')).toBeTruthy();
    expect(document.querySelector('[data-plan-summary]').textContent).toBe('PREMIUM');
    expect(forgetMapLists).toHaveBeenCalled();
  });

  it('opens on the subscription’s own interval', async () => {
    getBilling.mockResolvedValue({ ...BASE, status: 'active', interval: 'YEAR' });
    open();
    await screen.findByText('Yearly');
    expect(document.querySelector('[data-interval]').getAttribute('data-interval')).toBe('YEAR');
  });

  it('shows a failed change', async () => {
    getBilling.mockResolvedValue({ ...BASE, status: 'active' });
    changePlan.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Your card was declined.' }));
    open();
    await screen.findByText('Choose First Class');
    await act(async () => fireEvent.click(screen.getByText('Choose First Class')));
    expect(screen.getByText('Your card was declined.').getAttribute('role')).toBe('alert');
  });

  it('adds an extra map (with the interval when there’s no subscription) and stops paying for an unused one', async () => {
    getBilling.mockResolvedValue({ ...BASE, extraMapsPaid: 1 });
    setExtraMaps.mockResolvedValueOnce({ billing: { ...BASE, extraMapsPaid: 2 } }).mockResolvedValueOnce({ billing: { ...BASE, extraMapsPaid: 1 } });
    open();
    await screen.findByText('Add an extra map');
    await act(async () => fireEvent.click(screen.getByText('Add an extra map')));
    expect(setExtraMaps).toHaveBeenCalledWith({ quantity: 2, interval: 'MONTH' });
    expect(screen.getByText('Done: you pay for 2 extra maps.')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Stop paying for one')));
    expect(setExtraMaps).toHaveBeenLastCalledWith({ quantity: 1 });
    expect(screen.getByText('Done: you pay for 1 extra map.')).toBeTruthy();
  });

  it('names the maps that aren’t paid for', async () => {
    getBilling.mockResolvedValue({ ...BASE, lockedMapIds: ['m2'] });
    myMaps.load.mockResolvedValue([
      { id: 'm1', name: 'Mine' },
      { id: 'm2', name: 'Old trips' },
    ]);
    open();
    await waitFor(() => expect(document.querySelector('[data-extra-maps]').getAttribute('data-extra-maps')).toBe('Old trips'));
    expect(myMaps.load).toHaveBeenCalledWith('u1');
  });

  it('offers Stripe’s billing page to a subscriber, and says when payments are off', async () => {
    getBilling.mockResolvedValue({ ...BASE, status: 'active' });
    openBillingPortal.mockResolvedValue({ url: 'https://billing.stripe.test/p' });
    const { unmount } = open();
    await screen.findByText('Manage billing');
    await act(async () => fireEvent.click(screen.getByText('Manage billing')));
    expect(goToUrl).toHaveBeenCalledWith('https://billing.stripe.test/p');
    unmount();
    getBilling.mockResolvedValue({ ...BASE, paymentsEnabled: false });
    open();
    expect(await screen.findByText('Payments aren’t set up yet.')).toBeTruthy();
    expect(screen.queryByText('Manage billing')).toBeNull();
  });

  it('back from Checkout: thanks them and reads the plan again after 3 s and 8 s', async () => {
    vi.useFakeTimers();
    getBilling.mockResolvedValue(BASE);
    open('?billing=success');
    await flush();
    expect(screen.getByText(/checkout went through/)).toBeTruthy();
    expect(getBilling).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(2999);
    });
    expect(getBilling).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(getBilling).toHaveBeenCalledTimes(2);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(getBilling).toHaveBeenCalledTimes(3);
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(getBilling).toHaveBeenCalledTimes(3);
  });

  it('back from a cancelled Checkout: says nothing was charged, and reads nothing again', async () => {
    vi.useFakeTimers();
    getBilling.mockResolvedValue(BASE);
    open('?billing=cancelled');
    await flush();
    expect(screen.getByText('Checkout was cancelled, so nothing was charged.')).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(getBilling).toHaveBeenCalledTimes(1);
  });

  it('makes the new map that was waiting for its extra map, once paid', async () => {
    getBilling.mockResolvedValue(BASE);
    savePendingMap('u1', { name: 'Japan 2027' });
    createMap.mockResolvedValue({ map: { id: 'm9', name: 'Japan 2027' } });
    open('?billing=success');
    expect(await screen.findByText(/is ready/)).toBeTruthy();
    expect(createMap).toHaveBeenCalledWith({ name: 'Japan 2027' });
    expect(screen.getByText('Open it').getAttribute('href')).toBe(mapPath('m9'));
    expect(readPendingMap('u1')).toBeNull();
    expect(forgetMapLists).toHaveBeenCalled();
  });

  it('keeps trying while Stripe hasn’t confirmed the extra map, then offers to try again', { timeout: 20000 }, async () => {
    vi.useFakeTimers();
    getBilling.mockResolvedValue(BASE);
    savePendingMap('u1', { name: 'Japan 2027' });
    createMap.mockRejectedValue(Object.assign(new Error('x'), { response: { status: 402 } }));
    open('?billing=success');
    await flush();
    expect(screen.getByText('Making your new map “Japan 2027”…')).toBeTruthy();
    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        vi.advanceTimersByTime(2500);
      });
    }
    expect(createMap).toHaveBeenCalledTimes(4);
    expect(screen.getByText(/Stripe hasn’t confirmed the extra map yet/)).toBeTruthy();
    createMap.mockResolvedValue({ map: { id: 'm9', name: 'Japan 2027' } });
    await act(async () => fireEvent.click(screen.getByText('Make “Japan 2027” now')));
    expect(screen.getByText(/is ready/)).toBeTruthy();
  });

  it('says why a waiting map couldn’t be made', async () => {
    getBilling.mockResolvedValue(BASE);
    savePendingMap('u1', { name: 'Japan 2027' });
    createMap.mockRejectedValue(Object.assign(new Error('x'), { response: { status: 500 }, friendlyMessage: 'Server trouble.' }));
    open('?billing=success');
    expect(await screen.findByText('Server trouble.')).toBeTruthy();
    expect(createMap).toHaveBeenCalledTimes(1);
  });

  it('drops a waiting map when Checkout was cancelled', async () => {
    getBilling.mockResolvedValue(BASE);
    savePendingMap('u1', { name: 'Japan 2027' });
    open('?billing=cancelled');
    expect(await screen.findByText('Your new map “Japan 2027” wasn’t made, as nothing was paid.')).toBeTruthy();
    expect(createMap).not.toHaveBeenCalled();
    expect(readPendingMap('u1')).toBeNull();
  });
});
