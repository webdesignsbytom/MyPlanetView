import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import ComparePage from '@/pages/compare/ComparePage';
import { getMap, getMyMaps, openShareCode } from '@/api/travelApi';
import { drawCompareMap } from '@/utils/compare/drawCompareMap';
import { COMPARE_PAGE_URL } from '@/utils/constants/routes';
import { headings, here, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ getMap: vi.fn(), getMyMaps: vi.fn(), openShareCode: vi.fn() }));
vi.mock('@/utils/compare/drawCompareMap', () => ({ drawCompareMap: vi.fn() }));

const visit = (countryCode, status = 'VISITED') => ({ countryCode, status });
const MAPS = [
  { id: 'm-1', name: 'My map', role: 'OWNER', isDefault: true },
  { id: 'm-2', name: 'Solo trips', role: 'OWNER' },
  { id: 'm-3', name: 'The Smiths', role: 'VIEWER', ownerName: 'Jo Smith' },
];
const DETAIL = {
  'm-1': { id: 'm-1', name: 'My map', visits: [visit('FR'), visit('JP')] },
  'm-2': { id: 'm-2', name: 'Solo trips', visits: [visit('FR'), visit('PE')] },
  'm-3': { id: 'm-3', name: 'The Smiths', ownerName: 'Jo Smith', visits: [visit('FR')] },
};
const notFound = () => Object.assign(new Error('404'), { response: { status: 404 } });

const open = (at = COMPARE_PAGE_URL) => renderPage(<ComparePage />, { path: COMPARE_PAGE_URL, at, auth: signedIn() });
const select = (label) => screen.getByLabelText(label);
const results = () => document.getElementById('compare-results-heading');

beforeEach(() => {
  vi.clearAllMocks();
  getMyMaps.mockResolvedValue({ maps: MAPS });
  getMap.mockImplementation((id) => (DETAIL[id] ? Promise.resolve({ map: DETAIL[id] }) : Promise.reject(notFound())));
  drawCompareMap.mockResolvedValue(new Blob(['png']));
  URL.createObjectURL = vi.fn(() => 'blob:compare');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

describe('ComparePage', () => {
  it('has one main and its h1, and loads your maps with a loading state', async () => {
    open();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('compare-page-heading');
    expect(headings()).toEqual(['Compare two maps']);
    expect(main.querySelector('[role="status"]').textContent).toContain('Loading your maps…');
    await waitFor(() => expect(select('This map').value).toBe('m-1'));
    // The main map first; the second list leaves it out and ends with a share link
    const second = [...select('Compare with').querySelectorAll('option')].map((o) => [o.value, o.textContent]);
    expect(second).toEqual([
      ['', 'Choose a map'],
      ['m-2', 'Solo trips'],
      ['m-3', 'The Smiths (Jo Smith)'],
      ['link', 'A map’s share link…'],
    ]);
    expect(results()).toBeNull();
  });

  it('reads ?a=&b= and compares those two maps', async () => {
    open(`${COMPARE_PAGE_URL}?a=m-2&b=m-3`);
    await waitFor(() => expect(results()).toBeTruthy());
    expect(getMap).toHaveBeenCalledWith('m-2');
    expect(getMap).toHaveBeenCalledWith('m-3');
    expect(select('This map').value).toBe('m-2');
    expect(document.querySelector('[data-compare-summary]').textContent).toContain('Solo trips has 1 country the other doesn’t, and The Smiths 0 countries.');
  });

  it('choosing the second map puts both in the address', async () => {
    open();
    await waitFor(() => expect(select('Compare with')).toBeTruthy());
    fireEvent.change(select('Compare with'), { target: { value: 'm-2' } });
    await waitFor(() => expect(here()).toBe('/compare?a=m-1&b=m-2'));
    await waitFor(() => expect(results()).toBeTruthy());
  });

  it('names two maps with the same name by their owners', async () => {
    getMap.mockImplementation((id) => Promise.resolve({ map: { ...DETAIL[id], name: 'My map' } }));
    open(`${COMPARE_PAGE_URL}?a=m-1&b=m-3`);
    await waitFor(() => expect(results()).toBeTruthy());
    expect(document.querySelector('[data-compare-group="compare-only-b"] h3').textContent).toContain('Only My map (Jo Smith)');
  });

  it('compares with a pasted share link, which stays out of the address', async () => {
    openShareCode.mockResolvedValue({ map: { name: 'Jo’s map', visits: [visit('FR'), visit('BR')] } });
    open(`${COMPARE_PAGE_URL}?b=link`);
    const link = await screen.findByLabelText('Their share link');
    const compare = screen.getByText('Compare').closest('button');
    expect(compare.disabled).toBe(true);
    fireEvent.change(link, { target: { value: 'https://myplanetview.com/shared/abcd-efgh-jkmn' } });
    expect(compare.disabled).toBe(false);
    fireEvent.click(compare);
    await waitFor(() => expect(results()).toBeTruthy());
    // The code as pasted: the server normalises it
    expect(openShareCode).toHaveBeenCalledWith('abcd-efgh-jkmn');
    expect(here()).toBe('/compare?b=link');
  });

  it('a trip’s link, or a dead one, says why', async () => {
    openShareCode.mockResolvedValue({ trip: { id: 't1' } });
    const first = open(`${COMPARE_PAGE_URL}?b=link`);
    fireEvent.change(await screen.findByLabelText('Their share link'), { target: { value: 'ABCD-EFGH-JKMN' } });
    fireEvent.click(screen.getByText('Compare'));
    expect(await screen.findByText('That’s a trip’s link: comparing needs a map’s link.')).toBeTruthy();
    first.unmount();
    openShareCode.mockRejectedValue(notFound());
    open(`${COMPARE_PAGE_URL}?b=link`);
    fireEvent.change(await screen.findByLabelText('Their share link'), { target: { value: 'ABCD-EFGH-JKMN' } });
    fireEvent.click(screen.getByText('Compare'));
    expect(await screen.findByText('That link doesn’t work. It may have been reset, or sharing may have been turned off.')).toBeTruthy();
  });

  it('a map that isn’t yours to open says so, and shows a loading state first', async () => {
    open(`${COMPARE_PAGE_URL}?a=m-1&b=nope`);
    await waitFor(() => expect(document.querySelector('main').textContent).toContain('Comparing the maps…'));
    expect(await screen.findByText('That map doesn’t exist, or it hasn’t been shared with you.')).toBeTruthy();
    expect(results()).toBeNull();
  });

  it('says why your maps couldn’t be loaded', async () => {
    getMyMaps.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Maps are resting.' }));
    open();
    expect(await screen.findByText('Maps are resting.')).toBeTruthy();
  });
});
