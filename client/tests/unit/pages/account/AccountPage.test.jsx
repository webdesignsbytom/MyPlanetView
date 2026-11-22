import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import AccountPage from '@/pages/account/AccountPage';
import { ACCOUNT_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

// The account's cards load the profile, the plan and more: the page's own part is the frame
vi.mock('@/components/account/AccountPageMainContainer', () => ({ default: () => <div data-account-cards /> }));

describe('AccountPage', () => {
  it('has one main, labelled by its h1 and described by who is signed in', () => {
    renderPage(<AccountPage />, { path: ACCOUNT_PAGE_URL, auth: signedIn({ email: 'sam@example.com' }) });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('account-title');
    expect(main.getAttribute('aria-describedby')).toBe('account-subtitle');
    expect(headings()).toEqual(['Your account']);
    expect(document.getElementById('account-subtitle').textContent).toBe('Signed in as sam@example.com');
    expect(main.querySelector('[data-account-cards]')).toBeTruthy();
  });

  it('draws the passport stamps behind it, hidden from screen readers', () => {
    renderPage(<AccountPage />, { path: ACCOUNT_PAGE_URL, auth: signedIn() });
    const backdrop = document.querySelector('svg[aria-hidden="true"] pattern');
    expect(backdrop).toBeTruthy();
  });

  it('is never indexed', async () => {
    renderPage(<AccountPage />, { path: ACCOUNT_PAGE_URL, auth: signedIn() });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex,nofollow'));
    expect(document.title).toMatch(/Account/);
  });
});
