import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import EmbedPage from '@/pages/embed/EmbedPage';
import { openShareCode } from '@/api/travelApi';
import { EMBED_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ openShareCode: vi.fn() }));
vi.mock('@/components/map/WorldMap', () => ({
  default: ({ visitsByCode, label }) => <div data-world-map={label} data-visits={JSON.stringify(visitsByCode)} />,
}));
vi.mock('@/components/map/MapBackground', () => ({ default: ({ styleId }) => <div data-background={styleId} /> }));

const CODE = 'K7QX-M2PA-9RTW';
const open = () => renderPage(<EmbedPage />, { path: EMBED_PAGE_URL, at: `/embed/${CODE}` });
const MAP = {
  name: 'Charlie & Alex’s travels',
  style: 'starry',
  splitUk: true,
  visits: [
    { countryCode: 'FR', status: 'VISITED' },
    { countryCode: 'JP', status: 'WANT_TO_GO' },
  ],
  stats: { countries: 1, continents: 1 },
};

describe('EmbedPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the map alone, in its own style, with its counts and the link back', async () => {
    openShareCode.mockResolvedValue({ resource: 'map', map: MAP, role: 'VIEWER' });
    open();
    const world = await screen.findByText((_, el) => el?.getAttribute?.('data-world-map') === 'Charlie & Alex’s travels: world map');
    expect(JSON.parse(world.getAttribute('data-visits'))).toEqual({ FR: 'VISITED', JP: 'WANT_TO_GO' });
    expect(openShareCode).toHaveBeenCalledWith(CODE);
    expect(document.querySelector('[data-map-style]').getAttribute('data-map-style')).toBe('starry');
    const { count, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(headings()).toEqual(['Charlie & Alex’s travels']);
    expect(document.querySelector('[data-embed-stats]').textContent).toContain('1 country · 1 continent');
    const madeWith = screen.getByText('Made with My Planet View');
    expect(madeWith.getAttribute('href')).toBe('/?utm_source=embed&utm_medium=frame&utm_campaign=made-with');
    expect(madeWith.getAttribute('target')).toBe('_blank');
    expect(screen.getByText('Open the map').getAttribute('href')).toBe(`/shared/${CODE}`);
    expect(screen.getByText('Passport').getAttribute('href')).toBe(`/shared/${CODE}/passport`);
    // Zoom stamps, as the map has no wheel zoom here
    expect(screen.getByRole('group', { name: 'Zoom' })).toBeTruthy();
  });

  it('says so when the link no longer works, still with the link back', async () => {
    openShareCode.mockRejectedValue(Object.assign(new Error('x'), { response: { status: 404 } }));
    open();
    expect(await screen.findByText('This map isn’t shared any more.')).toBeTruthy();
    expect(screen.getByText('Made with My Planet View')).toBeTruthy();
    expect(onlyMain().count).toBe(1);
  });

  it('only shows a whole map, not a trip', async () => {
    openShareCode.mockResolvedValue({ resource: 'trip', trip: { title: 'Rome' } });
    open();
    expect(await screen.findByText('Only a whole map can be shown here.')).toBeTruthy();
  });

  it('says a failure that isn’t a missing link plainly', async () => {
    openShareCode.mockRejectedValue(new Error('offline'));
    open();
    expect(await screen.findByText('This map couldn’t be loaded just now.')).toBeTruthy();
  });

  it('says it’s loading first', () => {
    openShareCode.mockReturnValue(new Promise(() => {}));
    open();
    expect(screen.getByRole('status').textContent).toBe('Loading the map…');
  });
});
