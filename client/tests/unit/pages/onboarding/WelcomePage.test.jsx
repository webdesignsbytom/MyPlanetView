import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import WelcomePage from '@/pages/onboarding/WelcomePage';
import { createMap, getMap, getMyMaps, updateMap } from '@/api/travelApi';
import { saveMapSetup } from '@/utils/map/saveMapSetup';
import { WELCOME_PAGE_URL } from '@/utils/constants/routes';
import { elsewhere, headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ createMap: vi.fn(), getMap: vi.fn(), getMyMaps: vi.fn(), updateMap: vi.fn() }));
vi.mock('@/utils/map/saveMapSetup', async (importOriginal) => ({ ...(await importOriginal()), saveMapSetup: vi.fn() }));

const DEFAULT = { id: 'map-1', name: 'My map', groupType: 'SOLO', splitUk: true, travellers: [{ id: 't1', name: 'Charlie' }] };
const open = (user = {}) => renderPage(<WelcomePage />, { path: WELCOME_PAGE_URL, auth: signedIn(user) });

beforeEach(() => {
  vi.clearAllMocks();
});

// The set-up form's traveller dropdowns list every country: lookups by id
describe('WelcomePage', { timeout: 20000 }, () => {
  it('has one main, labelled by the welcome and described by the intro, with a loading state', () => {
    getMyMaps.mockReturnValue(new Promise(() => {}));
    open();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('welcome-heading');
    expect(main.getAttribute('aria-describedby')).toBe('welcome-intro');
    expect(headings()).toEqual(['Welcome, Charlie Reid']);
    expect(main.querySelector('[role="status"]').textContent).toContain('Loading…');
  });

  it('loads your default map into the form, and saves it before opening the map', async () => {
    getMyMaps.mockResolvedValue({ maps: [{ id: 'map-2', role: 'EDITOR' }, { id: 'map-1', role: 'OWNER', isDefault: true }] });
    getMap.mockResolvedValue({ map: DEFAULT });
    saveMapSetup.mockResolvedValue();
    open();
    await waitFor(() => expect(document.getElementById('traveller-0-name')?.value).toBe('Charlie'));
    expect(getMap).toHaveBeenCalledWith('map-1');
    fireEvent.click(screen.getByText('Start my map'));
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/map'));
    expect(saveMapSetup).toHaveBeenCalledWith('map-1', DEFAULT, expect.objectContaining({ name: 'My map', groupType: 'SOLO', travellers: [expect.objectContaining({ id: 't1', name: 'Charlie' })] }),
    );
    expect(createMap).not.toHaveBeenCalled();
  });

  it('with no map yet, starts the form from your name and makes the map', async () => {
    getMyMaps.mockResolvedValue({ maps: [] });
    createMap.mockResolvedValue({ map: { id: 'new' } });
    open({ name: 'Sam' });
    await waitFor(() => expect(document.getElementById('traveller-0-name')?.value).toBe('Sam'));
    fireEvent.change(document.getElementById('map-name'), { target: { value: '  Sam’s world ' } });
    fireEvent.click(document.getElementById('map-split-uk'));
    fireEvent.click(screen.getByText('Start my map'));
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/map'));
    expect(createMap).toHaveBeenCalledWith({
      name: 'Sam’s world',
      groupType: 'SOLO',
      travellers: [{ name: 'Sam', birthCountryCode: null, favouriteCountryCode: null }],
    });
    // A new map splits the UK unless they turned it off
    expect(updateMap).toHaveBeenCalledWith('new', { splitUk: false });
  });

  it('tells an unverified user what waits for the link', async () => {
    getMyMaps.mockResolvedValue({ maps: [] });
    open({ emailVerified: false, email: 'sam@example.com' });
    expect(await screen.findByText(/We’ve emailed a link to sam@example\.com/)).toBeTruthy();
  });

  it('shows why the map couldn’t be loaded, without the form', async () => {
    getMyMaps.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Maps are resting.' }));
    open();
    expect(await screen.findByText('Maps are resting.')).toBeTruthy();
    expect(document.querySelector('main [role="status"]')).toBeNull();
    expect(screen.queryByText('Start my map')).toBeNull();
  });
});
