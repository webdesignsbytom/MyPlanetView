// Vs mode's pages (26 Nov 2026; docs/API.md "Vs mode"): your comparisons, one compared, and a join link
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import VsPage from '@/pages/vs/VsPage';
import VsGroupPage from '@/pages/vs/VsGroupPage';
import VsJoinPage from '@/pages/vs/VsJoinPage';
import { joinVsGroup, previewVsGroup } from '@/api/vsApi';
import { getMyMaps } from '@/api/travelApi';
import { LOGIN_PAGE_URL, SIGN_UP_PAGE_URL, VS_GROUP_PAGE_URL, VS_JOIN_PAGE_URL, VS_PAGE_URL } from '@/utils/constants/routes';
import { authValue, elsewhere, headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/vsApi', () => ({ previewVsGroup: vi.fn(), joinVsGroup: vi.fn() }));
vi.mock('@/api/travelApi', () => ({ getMyMaps: vi.fn() }));
// The cards load and save through the API on their own (tests/unit/components/vs)
vi.mock('@/components/vs/VsListCard', () => ({ default: () => <section data-card='list' /> }));
vi.mock('@/components/vs/VsCreateCard', () => ({ default: ({ locked }) => <section data-card='create' data-locked={String(locked)} /> }));
vi.mock('@/components/vs/VsDetail', () => ({ default: ({ groupId }) => <h1 id='vs-page-heading' data-group={groupId}>A comparison</h1> }));

const MAPS = [
  { id: 'm-own', name: 'My map', role: 'OWNER' },
  { id: 'm-edit', name: 'Our trips', role: 'EDITOR' },
  { id: 'm-view', name: 'Their map', role: 'VIEWER' },
];

beforeEach(() => {
  vi.clearAllMocks();
  getMyMaps.mockResolvedValue({ maps: MAPS });
});

describe('VsPage', () => {
  it('has one main labelled by its h1, your comparisons, then starting one', () => {
    renderPage(<VsPage />, { path: VS_PAGE_URL, auth: signedIn() });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('vs-list-heading');
    expect(headings()).toEqual(['Vs mode']);
    expect([...document.querySelectorAll('main [data-card]')].map((el) => el.getAttribute('data-card'))).toEqual(['list', 'create']);
    expect(document.querySelector('[data-card="create"]').getAttribute('data-locked')).toBe('false');
  });

  it('locks starting one until the email address is verified, and is never indexed', async () => {
    renderPage(<VsPage />, { path: VS_PAGE_URL, auth: signedIn({ emailVerified: false }) });
    expect(document.querySelector('[data-card="create"]').getAttribute('data-locked')).toBe('true');
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
    expect(document.title).toMatch(/Vs mode/);
  });
});

describe('VsGroupPage', () => {
  it('opens the comparison in the address, its h1 labelling the main', () => {
    renderPage(<VsGroupPage />, { path: VS_GROUP_PAGE_URL, at: '/vs/vs-1', auth: signedIn() });
    expect(document.querySelector('[data-group]').getAttribute('data-group')).toBe('vs-1');
    expect(onlyMain().main.getAttribute('aria-labelledby')).toBe('vs-page-heading');
  });
});

describe('VsJoinPage', () => {
  const CODE = 'VS22-FRND-8MAX';
  const AT = `/vs/join/${CODE}`;
  const preview = (over = {}) => ({ id: 'vs-1', title: 'Who has travelled most?', startedBy: 'Sam Rivers', memberCount: 3, memberLimit: 8, full: false, youAreIn: false, ...over });
  const open = (auth = authValue()) => renderPage(<VsJoinPage />, { path: VS_JOIN_PAGE_URL, at: AT, auth });
  const main = () => document.querySelector('main');

  it('waits for the session, then shows who started it and how many are in', async () => {
    previewVsGroup.mockResolvedValue({ group: preview() });
    const { unmount } = open(authValue({ loading: true }));
    expect(previewVsGroup).not.toHaveBeenCalled();
    expect(headings()).toEqual(['Compare your travels']);
    expect(main().querySelector('[role="status"]').textContent).toContain('Opening the comparison…');
    unmount();
    open();
    await waitFor(() => expect(headings()).toEqual(['Who has travelled most?']));
    expect(previewVsGroup).toHaveBeenCalledWith(CODE);
    expect(main().getAttribute('aria-labelledby')).toBe('vs-join-heading');
    expect(main().textContent).toContain('Sam Rivers wants to compare travels');
    expect(main().textContent).toContain('3 people are in so far, 8 at most.');
    expect(main().textContent).toContain('never your map or photos');
  });

  it('signed out: sends you to sign in or sign up, and back here after', async () => {
    previewVsGroup.mockResolvedValue({ group: preview({ startedBy: null, memberCount: 1 }) });
    open();
    await screen.findByText('Sign in to join');
    expect(main().textContent).toContain('A friend wants to compare travels');
    expect(main().textContent).toContain('1 person is in');
    expect(screen.getByText('Sign in to join').getAttribute('href')).toBe(LOGIN_PAGE_URL);
    expect(getMyMaps).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Create an account'));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(SIGN_UP_PAGE_URL);
    expect(elsewhere().getAttribute('data-from')).toBe(AT);
  });

  it('someone already in goes straight to it; a broken link says so', async () => {
    previewVsGroup.mockResolvedValue({ group: preview({ youAreIn: true }) });
    const { unmount } = open(signedIn());
    await waitFor(() => expect(elsewhere().getAttribute('data-elsewhere')).toBe('/vs/vs-1'));
    unmount();
    previewVsGroup.mockRejectedValue(new Error('404'));
    open();
    await waitFor(() => expect(main().querySelector('[role="alert"]').textContent).toBe('That comparison’s link doesn’t work.'));
  });

  it('a full one can’t be joined, and an unverified address verifies first', async () => {
    previewVsGroup.mockResolvedValue({ group: preview({ full: true, memberCount: 8 }) });
    const { unmount } = open(signedIn());
    expect(await screen.findByText('This comparison is full.')).toBeTruthy();
    unmount();
    previewVsGroup.mockResolvedValue({ group: preview() });
    open(signedIn({ emailVerified: false }));
    expect(await screen.findByText(/Verify your email address to join/)).toBeTruthy();
    expect(screen.queryByText('Join the comparison')).toBeNull();
  });

  it('joins with the map you choose, or says why not', async () => {
    previewVsGroup.mockResolvedValue({ group: preview() });
    joinVsGroup.mockRejectedValueOnce(Object.assign(new Error('409'), { friendlyMessage: 'That comparison already has 8 people.' }));
    joinVsGroup.mockResolvedValueOnce({ group: { id: 'vs-1' } });
    open(signedIn());
    const select = await screen.findByLabelText('The map that counts for you');
    expect([...select.querySelectorAll('option')].map((o) => o.value)).toEqual(['m-own', 'm-edit']);
    fireEvent.change(select, { target: { value: 'm-edit' } });
    fireEvent.click(screen.getByText('Join the comparison'));
    await waitFor(() => expect(main().querySelector('[role="alert"]').textContent).toBe('That comparison already has 8 people.'));
    fireEvent.click(screen.getByText('Join the comparison'));
    await waitFor(() => expect(elsewhere().getAttribute('data-elsewhere')).toBe('/vs/vs-1'));
    expect(joinVsGroup).toHaveBeenLastCalledWith(CODE, 'm-edit');
  });

  it('with no map to count, says you need one', async () => {
    previewVsGroup.mockResolvedValue({ group: preview() });
    getMyMaps.mockResolvedValue({ maps: [MAPS[2]] });
    open(signedIn());
    expect(await screen.findByText('You need a map of your own (or one you edit) to join.')).toBeTruthy();
  });
});
