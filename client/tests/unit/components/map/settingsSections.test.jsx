import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DeleteMapSection from '@/components/map/DeleteMapSection';
import MainMapSection from '@/components/map/MainMapSection';
import MapUpgradeSection from '@/components/map/MapUpgradeSection';
import MapHomeSection from '@/components/map/MapHomeSection';
import MapDownloadSection from '@/components/map/MapDownloadSection';
import MapImportSection from '@/components/map/MapImportSection';
import { cancelMapUpgrade, deleteMap, makeMainMap, updateMap, upgradeMap } from '@/api/travelApi';
import { forgetMapLists } from '@/utils/map/mapListCache';
import { withProviders } from './helpers';

vi.mock('@/api/travelApi', () => ({
  deleteMap: vi.fn(),
  makeMainMap: vi.fn(),
  upgradeMap: vi.fn(),
  cancelMapUpgrade: vi.fn(),
  updateMap: vi.fn(),
}));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));
vi.mock('@/components/photos/PrintDownload', () => ({
  default: (props) => <button type='button' data-print-download={JSON.stringify(props.scope)} data-by-country={String(props.byCountry)}>{props.label}</button>,
}));

const MAP = { id: 'map-1', name: 'Our trips' };
const fail = (message) => Object.assign(new Error('no'), { friendlyMessage: message });

beforeEach(() => vi.clearAllMocks());

describe('DeleteMapSection', () => {
  it('asks before deleting, and can be kept', () => {
    render(<DeleteMapSection map={MAP} onDeleted={() => {}} />);
    expect(screen.getByText(/on “Our trips” is deleted for good/)).toBeTruthy();
    fireEvent.click(screen.getByText('Delete map'));
    fireEvent.click(screen.getByText('Keep it'));
    expect(screen.getByText('Delete map')).toBeTruthy();
    expect(deleteMap).not.toHaveBeenCalled();
  });

  it('deletes the map once confirmed', async () => {
    deleteMap.mockResolvedValue({});
    const onDeleted = vi.fn();
    render(<DeleteMapSection map={MAP} onDeleted={onDeleted} />);
    fireEvent.click(screen.getByText('Delete map'));
    fireEvent.click(screen.getByText('Yes, delete it'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(deleteMap).toHaveBeenCalledWith('map-1');
  });

  it('says why when it can’t delete', async () => {
    deleteMap.mockRejectedValue(fail('Not now.'));
    render(<DeleteMapSection map={MAP} onDeleted={() => {}} />);
    fireEvent.click(screen.getByText('Delete map'));
    fireEvent.click(screen.getByText('Yes, delete it'));
    expect((await screen.findByRole('alert')).textContent).toBe('Not now.');
    expect(screen.getByText('Yes, delete it').disabled).toBe(false);
  });

  it('is locked until the email address is verified', () => {
    render(<DeleteMapSection map={MAP} locked onDeleted={() => {}} />);
    expect(screen.queryByText('Delete map')).toBeNull();
    expect(screen.getByText(/Verify your email address to delete a map/)).toBeTruthy();
  });
});

describe('MainMapSection', () => {
  it('makes the map the main one, forgets the map lists and refreshes', async () => {
    makeMainMap.mockResolvedValue({});
    const onChanged = vi.fn();
    render(<MainMapSection map={MAP} onChanged={onChanged} />);
    fireEvent.click(screen.getByText('Make this my main map'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(makeMainMap).toHaveBeenCalledWith('map-1');
    expect(forgetMapLists).toHaveBeenCalled();
  });

  it('says why when it fails', async () => {
    makeMainMap.mockRejectedValue(new Error('x'));
    render(<MainMapSection map={MAP} />);
    fireEvent.click(screen.getByText('Make this my main map'));
    expect((await screen.findByRole('alert')).textContent).toBe('That didn’t work. Try again.');
  });

  it('is locked until the email address is verified', () => {
    render(<MainMapSection map={MAP} locked />);
    expect(screen.queryByText('Make this my main map')).toBeNull();
    expect(screen.getByText(/to choose your main map/)).toBeTruthy();
  });
});

describe('MapUpgradeSection', () => {
  const draw = (map, props = {}) => render(withProviders(<MapUpgradeSection map={{ ...MAP, ...map }} {...props} />));

  it('shows nothing for a map with no tier, or a locked one', () => {
    expect(draw({}).container.textContent).toBe('');
    expect(draw({ tier: 'LOCKED' }).container.textContent).toBe('');
  });

  it('sends an Economy account to choose a plan first', () => {
    const { container } = draw({ tier: 'ECONOMY', accountPlan: { id: 'FREE' } });
    expect(screen.getByText(/one of your 3 free maps, on Economy. Choose Business or First Class/)).toBeTruthy();
    expect(container.querySelector('a').getAttribute('href')).toBe('/account#account-plan-heading');
  });

  it('upgrades a free map on a paid account, and pays when no extra map is spare', async () => {
    upgradeMap.mockResolvedValue({ map: { tier: 'ECONOMY' } });
    const onChanged = vi.fn();
    const onPay = vi.fn();
    draw({ tier: 'ECONOMY', accountPlan: { id: 'REGULAR' } }, { onChanged, onPay });
    expect(screen.getByText(/An extra map costs/)).toBeTruthy();
    fireEvent.click(screen.getByText('Upgrade this map to Business'));
    await waitFor(() => expect(onPay).toHaveBeenCalled());
    expect(upgradeMap).toHaveBeenCalledWith('map-1');
    expect(forgetMapLists).toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalled();
  });

  it('needs no payment when the upgrade lands on the plan at once', async () => {
    upgradeMap.mockResolvedValue({ map: { tier: 'PLAN' } });
    const onPay = vi.fn();
    const onChanged = vi.fn();
    draw({ tier: 'ECONOMY', accountPlan: { id: 'PREMIUM' } }, { onPay, onChanged });
    fireEvent.click(screen.getByText('Upgrade this map to First Class'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(onPay).not.toHaveBeenCalled();
  });

  it('offers to pay for a map waiting on its upgrade', () => {
    const onPay = vi.fn();
    draw({ tier: 'ECONOMY', upgraded: true, accountPlan: { id: 'REGULAR' } }, { onPay });
    expect(screen.getByText(/is waiting for its upgrade to Business/)).toBeTruthy();
    fireEvent.click(screen.getByText('Pay for an extra map'));
    expect(onPay).toHaveBeenCalled();
  });

  it('moves the upgrade off a map on the plan by choice', async () => {
    cancelMapUpgrade.mockResolvedValue({});
    const onChanged = vi.fn();
    draw({ tier: 'PLAN', upgraded: true, accountPlan: { id: 'REGULAR' } }, { onChanged });
    expect(screen.getByText(/runs on your Business plan, as one of the extra maps you pay for/)).toBeTruthy();
    fireEvent.click(screen.getByText('Move the upgrade off this map'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(cancelMapUpgrade).toHaveBeenCalledWith('map-1');
  });

  it('has no button for an extra map paid for', () => {
    const { container } = draw({ tier: 'PLAN', accountPlan: { id: 'REGULAR' } });
    expect(screen.getByText(/using one of the extra maps you pay for/)).toBeTruthy();
    expect(container.querySelector('button')).toBeNull();
  });

  it('says why when it fails, and is locked for an unverified address', async () => {
    upgradeMap.mockRejectedValue(fail('Try later.'));
    draw({ tier: 'ECONOMY', accountPlan: { id: 'REGULAR' } });
    fireEvent.click(screen.getByText('Upgrade this map to Business'));
    expect((await screen.findByRole('alert')).textContent).toBe('Try later.');
    draw({ tier: 'ECONOMY', accountPlan: { id: 'REGULAR' } }, { locked: true });
    expect(screen.getByText(/to change which plan this map is on/)).toBeTruthy();
  });
});

describe('MapHomeSection', () => {
  it('names the birthplace it falls back to, and saves the home chosen', async () => {
    updateMap.mockResolvedValue({});
    const onChanged = vi.fn();
    const { container } = render(<MapHomeSection map={{ ...MAP, homeCountryCode: null, stats: { homeCountryCode: 'NL' } }} onChanged={onChanged} />);
    expect(screen.getByText(/Not set, home is the Netherlands, where a traveller was born/)).toBeTruthy();
    const select = container.querySelector('select#map-home-country');
    expect(select.value).toBe('');
    fireEvent.change(select, { target: { value: 'FR' } });
    expect(await screen.findByText('Saved')).toBeTruthy();
    expect(updateMap).toHaveBeenCalledWith('map-1', { homeCountryCode: 'FR' });
    expect(onChanged).toHaveBeenCalled();
  });

  it('clears the home with "Not set"', async () => {
    updateMap.mockResolvedValue({});
    const { container } = render(<MapHomeSection map={{ ...MAP, homeCountryCode: 'FR' }} />);
    expect(screen.getByText('The statistics measure distances from home. Not set, home is where a traveller was born.')).toBeTruthy();
    fireEvent.change(container.querySelector('select'), { target: { value: '' } });
    await waitFor(() => expect(updateMap).toHaveBeenCalledWith('map-1', { homeCountryCode: null }));
  });

  it('says why when it doesn’t save', async () => {
    updateMap.mockRejectedValue(fail('No.'));
    const { container } = render(<MapHomeSection map={{ ...MAP }} />);
    fireEvent.change(container.querySelector('select'), { target: { value: 'JP' } });
    expect((await screen.findByRole('alert')).textContent).toBe('No.');
  });
});

describe('MapDownloadSection and MapImportSection', () => {
  it('offers the whole map’s photos as a zip, a folder per country', () => {
    const { container } = render(<MapDownloadSection map={MAP} />);
    const button = container.querySelector('[data-print-download]');
    expect(JSON.parse(button.getAttribute('data-print-download'))).toEqual({ mapId: 'map-1' });
    expect(button.getAttribute('data-by-country')).toBe('true');
    expect(button.textContent).toBe('Download or print photos');
    expect(screen.getByText(/Every photo on “Our trips” as a zip/)).toBeTruthy();
  });

  it('links to the import page for this map', () => {
    const { container } = render(withProviders(<MapImportSection map={MAP} />));
    expect(container.querySelector('a').getAttribute('href')).toBe('/import?map=map-1');
    expect(screen.getByText(/onto “Our trips”/)).toBeTruthy();
  });
});
