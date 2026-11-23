import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import MapPage from '@/pages/map/MapPage';
import useTravelMap from '@/hooks/useTravelMap';
import { preloadPhotoPage } from '@/hooks/usePhotoPage';
import { preloadLandmarks } from '@/hooks/useLandmarks';
import { myMaps } from '@/utils/map/mapListCache';
import { MAP_BY_ID_PAGE_URL, MAP_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/hooks/useTravelMap', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useMapSettings', () => ({ default: () => ({ settings: { style: 'animated', landmarkPins: 'stamped' }, updateSetting: vi.fn() }) }));
vi.mock('@/hooks/usePhotoPage', () => ({ preloadPhotoPage: vi.fn() }));
vi.mock('@/hooks/useLandmarks', () => ({ preloadLandmarks: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({ myMaps: { load: vi.fn() } }));
// The map itself is MapExperience's own test's: a stand-in that names what it was given
vi.mock('@/components/map/MapExperience', () => ({
  default: ({ map, role, shareCode, currentUser }) => (
    <main id='main-content' data-map-experience={map.id} data-role={role} data-share={shareCode ?? ''} data-user={currentUser?.id ?? ''}>
      <h1>{map.name}</h1>
    </main>
  ),
}));

const MAP = { id: 'map-1', name: 'Charlie & Alex’s travels', role: 'OWNER' };
const state = (over = {}) => ({ map: null, trips: [], error: null, ...over });

const openDefault = () => renderPage(<MapPage />, { path: MAP_PAGE_URL, auth: signedIn() });
const openById = (id = 'map-7') => renderPage(<MapPage />, { path: MAP_BY_ID_PAGE_URL, at: `/maps/${id}`, auth: signedIn() });

// The map's and trip's code is lazy: on a busy machine it takes more than waitFor's second
const LAZY = { timeout: 8000 };

beforeEach(() => {
  vi.clearAllMocks();
  useTravelMap.mockReturnValue(state());
  myMaps.load.mockResolvedValue([]);
});

describe('MapPage', { timeout: 20000 }, () => {
  it('shows one main with a loading screen while the map comes', () => {
    myMaps.load.mockReturnValue(new Promise(() => {}));
    openDefault();
    const { count, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(document.querySelector('main [role="status"]').textContent).toContain('Loading…');
    // The page always has its h1: a hidden one while loading, the map's name once it opens
    expect(headings()).toEqual(['Opening your map']);
    expect(document.querySelector('h1').className).toContain('sr-only');
  });

  it('/map opens your own default map and remembers it', async () => {
    myMaps.load.mockResolvedValue([{ id: 'shared', role: 'VIEWER' }, { id: 'map-1', role: 'OWNER', isDefault: true }]);
    useTravelMap.mockImplementation((mapId) => state(mapId === 'map-1' ? { map: MAP } : {}));
    openDefault();
    await waitFor(() => expect(document.querySelector('[data-map-experience]')?.getAttribute('data-map-experience')).toBe('map-1'), LAZY);
    expect(myMaps.load).toHaveBeenCalledWith('user-1');
    expect(JSON.parse(localStorage.getItem('mpv:defaultMap'))).toEqual({ userId: 'user-1', mapId: 'map-1' });
    expect(onlyMain().count).toBe(1);
    expect(headings()).toEqual([MAP.name]);
    expect(document.querySelector('[data-map-experience]').getAttribute('data-user')).toBe('user-1');
    // Everything starts together: the unplaced photos, and the landmarks when pins show at once
    expect(preloadPhotoPage).toHaveBeenCalledWith(expect.objectContaining({ mapId: 'map-1', unplaced: true }));
    expect(preloadLandmarks).toHaveBeenCalled();
  });

  it('/map starts with the map remembered from last time while the list confirms it', () => {
    localStorage.setItem('mpv:defaultMap', JSON.stringify({ userId: 'user-1', mapId: 'map-1' }));
    myMaps.load.mockReturnValue(new Promise(() => {}));
    openDefault();
    expect(useTravelMap).toHaveBeenCalledWith('map-1', expect.anything());
  });

  it('a map remembered for someone else is not used', () => {
    localStorage.setItem('mpv:defaultMap', JSON.stringify({ userId: 'someone-else', mapId: 'map-1' }));
    myMaps.load.mockReturnValue(new Promise(() => {}));
    openDefault();
    expect(useTravelMap).not.toHaveBeenCalledWith('map-1', expect.anything());
  });

  it('with no map at all, offers to set one up', async () => {
    myMaps.load.mockResolvedValue([]);
    openDefault();
    expect(await screen.findByText('No map yet')).toBeTruthy();
    expect(screen.getByText('Set up my map').getAttribute('href')).toBe('/welcome');
    expect(onlyMain().count).toBe(1);
    expect(headings()).toEqual(['No map yet']);
  });

  it('when the map list fails, says why', async () => {
    myMaps.load.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Maps are resting.' }));
    openDefault();
    expect(await screen.findByText('Maps are resting.')).toBeTruthy();
    expect(headings()).toEqual(['This map can’t be opened']);
    // Already on your own map: no link to it
    expect(screen.queryByText('Go to your own map')).toBeNull();
  });

  it('/maps/:mapId opens that map, without reading the list', async () => {
    useTravelMap.mockReturnValue(state({ map: { ...MAP, id: 'map-7', role: 'VIEWER' } }));
    openById();
    await waitFor(() => expect(document.querySelector('[data-map-experience]')).toBeTruthy(), LAZY);
    expect(useTravelMap).toHaveBeenCalledWith('map-7', { optimistic: true });
    expect(myMaps.load).not.toHaveBeenCalled();
    expect(document.querySelector('[data-map-experience]').getAttribute('data-role')).toBe('VIEWER');
  });

  it('a map that can’t be opened says why and links to your own', async () => {
    useTravelMap.mockReturnValue(state({ error: 'This map doesn’t exist, or it hasn’t been shared with you.' }));
    openById();
    expect(await screen.findByText('This map doesn’t exist, or it hasn’t been shared with you.')).toBeTruthy();
    expect(screen.getByText('Go to your own map').getAttribute('href')).toBe('/map');
    expect(onlyMain().count).toBe(1);
  });

  it('an unverified user’s visit changes wait for the server', () => {
    renderPage(<MapPage />, { path: MAP_BY_ID_PAGE_URL, at: '/maps/map-7', auth: signedIn({ emailVerified: false }) });
    expect(useTravelMap).toHaveBeenCalledWith('map-7', { optimistic: false });
  });
});
