import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import UnsubscribePage from '@/pages/unsubscribe/UnsubscribePage';
import { unsubscribeFromEmails } from '@/api/emailsApi';
import { UNSUBSCRIBE_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage } from '../renderPage';

vi.mock('@/api/emailsApi', () => ({ unsubscribeFromEmails: vi.fn() }));

const open = (at = `${UNSUBSCRIBE_PAGE_URL}?u=user-1&t=sig-1`) => renderPage(<UnsubscribePage />, { path: UNSUBSCRIBE_PAGE_URL, at });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UnsubscribePage', () => {
  it('has one main, labelled by its h1, and asks before stopping anything', () => {
    open();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('unsubscribe-heading');
    expect(headings()).toEqual(['On this day']);
    expect(main.textContent).toContain('Stop the “On this day” emails');
    // Opening the link alone stops nothing
    expect(unsubscribeFromEmails).not.toHaveBeenCalled();
    expect(screen.getByText('your account page').getAttribute('href')).toBe('/account');
  });

  it('stops the emails with the signed link’s values, then says so', async () => {
    unsubscribeFromEmails.mockResolvedValue({});
    open();
    fireEvent.click(screen.getByText('Stop these emails'));
    expect(await screen.findByText(/Done: no more “On this day” emails/)).toBeTruthy();
    expect(unsubscribeFromEmails).toHaveBeenCalledWith({ u: 'user-1', t: 'sig-1' });
    expect(screen.queryByText('Stop these emails')).toBeNull();
  });

  it('a "Welcome home" link (`l=trips`) names that email and sends its list back', async () => {
    unsubscribeFromEmails.mockResolvedValue({});
    open(`${UNSUBSCRIBE_PAGE_URL}?u=user-1&t=sig-2&l=trips`);
    expect(headings()).toEqual(['Welcome home']);
    expect(onlyMain().main.textContent).toContain('Stop the “Welcome home” emails, the reminder to share a trip');
    fireEvent.click(screen.getByText('Stop these emails'));
    expect(await screen.findByText(/Done: no more “Welcome home” emails/)).toBeTruthy();
    expect(unsubscribeFromEmails).toHaveBeenCalledWith({ u: 'user-1', t: 'sig-2', l: 'trips' });
  });

  it('a list it doesn’t know reads as "On this day" but goes back as it came (the server refuses it)', async () => {
    unsubscribeFromEmails.mockRejectedValue(new Error('x'));
    open(`${UNSUBSCRIBE_PAGE_URL}?u=user-1&t=sig-3&l=news`);
    expect(headings()).toEqual(['On this day']);
    fireEvent.click(screen.getByText('Stop these emails'));
    await waitFor(() => expect(unsubscribeFromEmails).toHaveBeenCalledWith({ u: 'user-1', t: 'sig-3', l: 'news' }));
  });

  it('a link missing its values can’t stop anything', () => {
    open(`${UNSUBSCRIBE_PAGE_URL}?u=user-1`);
    expect(screen.getByText('Stop these emails').closest('button').disabled).toBe(true);
  });

  it('says why it failed and points to the account page', async () => {
    unsubscribeFromEmails.mockRejectedValue(new Error('x'));
    open();
    fireEvent.click(screen.getByText('Stop these emails'));
    await waitFor(() => expect(screen.getByText('That didn’t work. Change your emails on your account page instead.')).toBeTruthy());
    expect(screen.getByText('Stop these emails').closest('button').disabled).toBe(false);
  });

  it('is never indexed', async () => {
    open();
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,nofollow'));
  });
});
