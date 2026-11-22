import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import ChallengeJoinPage from '@/pages/challenges/ChallengeJoinPage';
import { joinChallenge, previewChallenge } from '@/api/challengesApi';
import { getMyMaps } from '@/api/travelApi';
import { CHALLENGE_JOIN_PAGE_URL, LOGIN_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { authValue, elsewhere, headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/challengesApi', () => ({ previewChallenge: vi.fn(), joinChallenge: vi.fn() }));
vi.mock('@/api/travelApi', () => ({ getMyMaps: vi.fn() }));

const CODE = 'CHA2-YR5R-DTRP';
const AT = `/challenges/join/${CODE}`;

const preview = (over = {}) => ({
  id: 'ch-1',
  title: 'Two years on the road',
  status: 'RUNNING',
  measure: 'NEW_COUNTRIES',
  startsOn: '2025-01-01',
  endsOn: '2026-12-31',
  target: 10,
  startedBy: 'Sam Carter',
  memberCount: 3,
  youAreIn: false,
  full: false,
  ...over,
});

const MAPS = [
  { id: 'm-own', name: 'My map', role: 'OWNER' },
  { id: 'm-edit', name: 'Our trips', role: 'EDITOR' },
  { id: 'm-view', name: 'Their map', role: 'VIEWER' },
];

const open = (auth = authValue()) => renderPage(<ChallengeJoinPage />, { path: CHALLENGE_JOIN_PAGE_URL, at: AT, auth });
const ticket = () => document.querySelector('main');

describe('ChallengeJoinPage', () => {
  beforeEach(() => {
    getMyMaps.mockResolvedValue({ maps: MAPS });
  });

  it('waits for the session before asking, with a loading state and a stand-in title', () => {
    previewChallenge.mockResolvedValue({ challenge: preview() });
    open(authValue({ loading: true }));
    expect(previewChallenge).not.toHaveBeenCalled();
    expect(onlyMain().count).toBe(1);
    expect(headings()).toEqual(['You’ve been challenged']);
    expect(ticket().querySelector('[role="status"]').textContent).toContain('Opening the challenge…');
  });

  it('shows what the challenge counts, when, the target and who is in', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview() });
    open();
    await waitFor(() => expect(headings()).toEqual(['Two years on the road']));
    expect(previewChallenge).toHaveBeenCalledWith(CODE);
    const { main, id } = onlyMain();
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('challenge-join-heading');
    expect(main.textContent).toContain('First to 10');
    expect(main.textContent).toContain('Started by Sam Carter, 3 people in');
    expect(main.textContent).toContain('never your map or photos');
  });

  it('signed out: sends you to sign in or sign up, and back here after', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview({ startedBy: null, memberCount: 1 }) });
    open();
    await waitFor(() => expect(screen.getByText('Sign in to join')).toBeTruthy());
    expect(ticket().textContent).toContain('Started by a friend, 1 person in');
    expect(screen.getByText('Sign in to join').getAttribute('href')).toBe(LOGIN_PAGE_URL);
    expect(screen.getByText('Create an account').getAttribute('href')).toBe(SIGN_UP_PAGE_URL);
    // No maps asked for while signed out
    expect(getMyMaps).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Create an account'));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(SIGN_UP_PAGE_URL);
    expect(elsewhere().getAttribute('data-from')).toBe(AT);
  });

  it('sign in carries the way back too', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview() });
    open();
    fireEvent.click(await screen.findByText('Sign in to join'));
    expect(elsewhere().getAttribute('data-elsewhere')).toBe(LOGIN_PAGE_URL);
    expect(elsewhere().getAttribute('data-from')).toBe(AT);
  });

  it('someone already in goes straight to its page', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview({ youAreIn: true }) });
    open(signedIn());
    await waitFor(() => expect(elsewhere().getAttribute('data-elsewhere')).toBe('/challenges/ch-1'));
  });

  it('says when the link doesn’t work', async () => {
    previewChallenge.mockRejectedValue(new Error('404'));
    open();
    await waitFor(() => expect(ticket().querySelector('[role="alert"]').textContent).toBe('That challenge link doesn’t work.'));
    expect(ticket().querySelector('[role="status"]')).toBeNull();
  });

  it('a finished or full challenge can’t be joined', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview({ status: 'ENDED' }) });
    const { unmount } = open(signedIn());
    expect(await screen.findByText('This challenge has finished.')).toBeTruthy();
    unmount();
    previewChallenge.mockResolvedValue({ challenge: preview({ full: true }) });
    open(signedIn());
    expect(await screen.findByText('This challenge is full.')).toBeTruthy();
    expect(screen.queryByText('Join the challenge')).toBeNull();
  });

  it('an unverified email address must be verified first', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview() });
    open(signedIn({ emailVerified: false }));
    expect(await screen.findByText(/Verify your email address to join/)).toBeTruthy();
    expect(screen.queryByText('Join the challenge')).toBeNull();
  });

  it('offers the maps you own or edit, and joins with the one chosen', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview() });
    joinChallenge.mockResolvedValue({ challenge: { id: 'ch-1' } });
    open(signedIn());
    const select = await screen.findByLabelText('The map that counts for you');
    const options = [...select.querySelectorAll('option')].map((o) => [o.value, o.textContent]);
    expect(options).toEqual([
      ['m-own', 'My map'],
      ['m-edit', 'Our trips (you edit it)'],
    ]);
    expect(select.value).toBe('m-own');
    fireEvent.change(select, { target: { value: 'm-edit' } });
    fireEvent.click(screen.getByText('Join the challenge'));
    await waitFor(() => expect(elsewhere().getAttribute('data-elsewhere')).toBe('/challenges/ch-1'));
    expect(joinChallenge).toHaveBeenCalledWith(CODE, 'm-edit');
  });

  it('says why joining failed, and stays', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview() });
    joinChallenge.mockRejectedValue(Object.assign(new Error('409'), { friendlyMessage: 'You’re in too many challenges.' }));
    open(signedIn());
    fireEvent.click(await screen.findByText('Join the challenge'));
    await waitFor(() => expect(ticket().querySelector('[role="alert"]').textContent).toBe('You’re in too many challenges.'));
    expect(elsewhere()).toBeNull();
    expect(screen.getByText('Join the challenge').closest('button').disabled).toBe(false);
  });

  it('with no map to count, says you need one', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview() });
    getMyMaps.mockResolvedValue({ maps: [{ id: 'm-view', name: 'Their map', role: 'VIEWER' }] });
    open(signedIn());
    expect(await screen.findByText('You need a map of your own (or one you edit) to join.')).toBeTruthy();
  });

  it('says when the maps couldn’t be loaded', async () => {
    previewChallenge.mockResolvedValue({ challenge: preview() });
    getMyMaps.mockRejectedValue(Object.assign(new Error('500'), { friendlyMessage: 'Your maps are resting.' }));
    open(signedIn());
    expect(await screen.findByText('Your maps are resting.')).toBeTruthy();
  });
});
