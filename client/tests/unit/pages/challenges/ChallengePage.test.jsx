import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import ChallengePage from '@/pages/challenges/ChallengePage';
import { getChallenge } from '@/api/challengesApi';
import { CHALLENGE_PAGE_URL, CHALLENGES_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/challengesApi', () => ({ getChallenge: vi.fn() }));
// The cards under the title have their own API calls; the page's part is the challenge and its heading
vi.mock('@/components/challenges/ChallengeLeaderboard', () => ({ default: ({ members }) => <ol data-board={members.length} /> }));
vi.mock('@/components/challenges/ChallengeInviteCard', () => ({ default: () => <section data-card='invite' /> }));
vi.mock('@/components/challenges/ChallengeMyMapCard', () => ({ default: () => <section data-card='my-map' /> }));
vi.mock('@/components/challenges/ChallengeSettingsCard', () => ({ default: () => <section data-card='settings' /> }));

const challenge = (over = {}) => ({
  id: 'ch-1',
  title: 'Most new countries',
  status: 'RUNNING',
  measure: 'NEW_COUNTRIES',
  startsOn: '2026-01-01',
  endsOn: '2026-12-31',
  target: null,
  youStartedIt: false,
  members: [{ userId: 'u1', name: 'Sam', count: 2 }],
  ...over,
});

const open = (auth = signedIn()) => renderPage(<ChallengePage />, { path: CHALLENGE_PAGE_URL, at: '/challenges/ch-1', auth });

describe('ChallengePage', () => {
  it('asks for the challenge in the address, with a loading state first', async () => {
    getChallenge.mockReturnValue(new Promise(() => {}));
    open();
    expect(getChallenge).toHaveBeenCalledWith('ch-1');
    expect(onlyMain().count).toBe(1);
    expect(document.querySelector('main [role="status"]').textContent).toContain('Loading the challenge…');
  });

  it('titles the page with the challenge, its h1 labelling the main', async () => {
    getChallenge.mockResolvedValue({ challenge: challenge() });
    open();
    await waitFor(() => expect(headings()).toEqual(['Most new countries']));
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('challenge-page-heading');
    expect(document.getElementById('challenge-page-heading').tagName).toBe('H1');
    expect(main.querySelector('[data-board="1"]')).toBeTruthy();
    // Only the starter gets the settings card
    expect(main.querySelector('[data-card="settings"]')).toBeNull();
  });

  it('gives the starter the settings, and hides the invite once it has ended', async () => {
    getChallenge.mockResolvedValue({ challenge: challenge({ youStartedIt: true, status: 'ENDED' }) });
    open();
    await waitFor(() => expect(document.querySelector('[data-card="settings"]')).toBeTruthy());
    expect(document.querySelector('[data-card="invite"]')).toBeNull();
  });

  it('says when the challenge can’t be opened, with a way back to yours', async () => {
    getChallenge.mockRejectedValue(Object.assign(new Error('404'), { friendlyMessage: 'That challenge doesn’t exist.' }));
    open();
    await waitFor(() => expect(document.querySelector('main [role="alert"]').textContent).toBe('That challenge doesn’t exist.'));
    const back = [...document.querySelectorAll('main a')].find((a) => a.textContent === 'Your challenges');
    expect(back.getAttribute('href')).toBe(CHALLENGES_PAGE_URL);
    // The main is still labelled by the card's title
    expect(document.getElementById('challenge-page-heading').textContent).toBe('Challenge');
  });

  it('keeps an h1 when the challenge can’t be opened', async () => {
    getChallenge.mockRejectedValue(new Error('404'));
    open();
    await waitFor(() => expect(document.querySelector('main [role="alert"]')).toBeTruthy());
    expect(headings()).toEqual(['Challenge']);
  });
});
