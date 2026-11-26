import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import ChallengesPage from '@/pages/challenges/ChallengesPage';
import { CHALLENGES_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The cards load and save through the challenges API: the page decides their order and the lock
vi.mock('@/components/challenges/ChallengeListCard', () => ({ default: () => <section data-card='list' /> }));
vi.mock('@/components/challenges/ChallengeCreateCard', () => ({
  default: ({ locked }) => <section data-card='create' data-locked={String(locked)} />,
}));

describe('ChallengesPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<ChallengesPage />, { path: CHALLENGES_PAGE_URL, auth: signedIn() });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('challenges-page-heading');
    expect(headings()).toEqual(['Challenges']);
  });

  it('lists your challenges, then starting one', () => {
    renderPage(<ChallengesPage />, { path: CHALLENGES_PAGE_URL, auth: signedIn() });
    const cards = [...document.querySelectorAll('main [data-card]')].map((el) => el.getAttribute('data-card'));
    expect(cards).toEqual(['list', 'create']);
    expect(document.querySelector('[data-card="create"]').getAttribute('data-locked')).toBe('false');
  });

  it('points to Vs mode, for everything compared at once', () => {
    renderPage(<ChallengesPage />, { path: CHALLENGES_PAGE_URL, auth: signedIn() });
    expect(document.querySelector('main a[href="/vs"]').textContent).toBe('Open Vs mode');
  });

  it('locks starting one until the email address is verified', () => {
    renderPage(<ChallengesPage />, { path: CHALLENGES_PAGE_URL, auth: signedIn({ emailVerified: false }) });
    expect(document.querySelector('[data-card="create"]').getAttribute('data-locked')).toBe('true');
  });

  it('is never indexed', async () => {
    renderPage(<ChallengesPage />, { path: CHALLENGES_PAGE_URL, auth: signedIn() });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^noindex/));
    expect(document.title).toMatch(/Challenges/);
  });
});
