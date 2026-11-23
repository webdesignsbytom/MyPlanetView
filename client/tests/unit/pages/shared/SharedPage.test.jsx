import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import SharedPage from '@/pages/shared/SharedPage';
import { openShareCode } from '@/api/travelApi';
import { SHARED_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ openShareCode: vi.fn() }));
vi.mock('@/hooks/useMapSettings', () => ({ default: () => ({ settings: { style: 'animated', showAntarctica: true }, updateSetting: vi.fn() }) }));
vi.mock('@/components/map/MapExperience', () => ({
  default: ({ map, role, shareCode, currentUser }) => (
    <main id='main-content' data-map-experience={map.name} data-role={role} data-share={shareCode} data-user={currentUser?.id ?? ''}>
      <h1>{map.name}</h1>
    </main>
  ),
}));
vi.mock('@/components/trips/TripView', () => ({
  default: ({ trip, shareCode }) => (
    <div data-trip-view={trip.title} data-role={trip.role} data-share={shareCode}>
      <h1>{trip.title}</h1>
    </div>
  ),
}));

const CODE = 'ABCD-EFGH-JKMN';
const open = (auth) => renderPage(<SharedPage />, { path: SHARED_PAGE_URL, at: `/shared/${CODE}`, ...(auth ? { auth } : {}) });

// The map's and trip's code is lazy: on a busy machine it takes more than waitFor's second
const LAZY = { timeout: 8000 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SharedPage', { timeout: 20000 }, () => {
  it('shows one main with a loading screen while the link opens', () => {
    openShareCode.mockReturnValue(new Promise(() => {}));
    open();
    expect(openShareCode).toHaveBeenCalledWith(CODE);
    expect(onlyMain().count).toBe(1);
    expect(document.querySelector('main [role="status"]')).toBeTruthy();
    // Before it knows whether the link is a map or a trip
    expect(headings()).toEqual(['Opening the shared link']);
  });

  it('a map’s link opens the map as a viewer, signed out', async () => {
    openShareCode.mockResolvedValue({ resource: 'map', role: 'VIEWER', map: { name: 'Charlie & Alex’s travels' }, trips: [] });
    open();
    await waitFor(() => expect(document.querySelector('[data-map-experience]')).toBeTruthy(), LAZY);
    const map = document.querySelector('[data-map-experience]');
    expect(map.getAttribute('data-role')).toBe('VIEWER');
    expect(map.getAttribute('data-share')).toBe(CODE);
    expect(map.getAttribute('data-user')).toBe('');
    expect(onlyMain().count).toBe(1);
    expect(headings()).toEqual(['Charlie & Alex’s travels']);
  });

  it('signed in, the map knows who is looking', async () => {
    openShareCode.mockResolvedValue({ resource: 'map', role: 'VIEWER', map: { name: 'Ours' } });
    open(signedIn());
    await waitFor(() => expect(document.querySelector('[data-map-experience]')?.getAttribute('data-user')).toBe('user-1'), LAZY);
  });

  it('a trip’s link opens the trip in the page frame, with one main', async () => {
    openShareCode.mockResolvedValue({ resource: 'trip', role: 'VIEWER', trip: { title: 'Italian summer' } });
    open();
    await waitFor(() => expect(document.querySelector('[data-trip-view]')).toBeTruthy(), LAZY);
    expect(document.querySelector('[data-trip-view]').getAttribute('data-share')).toBe(CODE);
    expect(document.querySelector('[data-trip-view]').getAttribute('data-role')).toBe('VIEWER');
    const { count, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(headings()).toEqual(['Italian summer']);
  });

  it('a dead link says so, with a way to the home page', async () => {
    openShareCode.mockRejectedValue(Object.assign(new Error('404'), { response: { status: 404 } }));
    open();
    expect(await screen.findByText('This link doesn’t work. It may have been reset, or sharing may have been turned off.')).toBeTruthy();
    expect(headings()).toEqual(['Link not working']);
    expect(screen.getByText('What is this site?').getAttribute('href')).toBe('/');
    expect(onlyMain().count).toBe(1);
  });

  it('any other failure gives its own message', async () => {
    openShareCode.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many tries.' }));
    open();
    expect(await screen.findByText('Too many tries.')).toBeTruthy();
  });
});
