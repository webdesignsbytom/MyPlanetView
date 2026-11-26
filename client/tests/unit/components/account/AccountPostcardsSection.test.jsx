// The account page's postcards (components/account/AccountPostcardsSection.jsx; docs/API.md "Postcards")
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountPostcardsSection from '@/components/account/AccountPostcardsSection';
import { deletePostcard, getMyPostcards, resetPostcardLink } from '@/api/postcardsApi';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';

vi.mock('@/api/postcardsApi', () => ({ getMyPostcards: vi.fn(), resetPostcardLink: vi.fn(), deletePostcard: vi.fn() }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));

const ROME = { id: 'pc-rome', code: 'PST2-CRD8-RMEC', kind: 'LANDMARK', countryCode: 'IT', landmark: { name: 'Colosseum' }, toName: 'Sam', sentAt: '2026-11-24T10:00:00.000Z' };
const FRANCE = { id: 'pc-france', code: 'PST2-CRD8-FRNC', kind: 'COUNTRY', countryCode: 'FR', landmark: null, toName: null, sentAt: '2026-11-22T10:00:00.000Z' };
const row = (id) => document.querySelector(`[data-postcard-row="${id}"]`);

beforeEach(() => {
  vi.clearAllMocks();
  getMyPostcards.mockResolvedValue({ postcards: [ROME, FRANCE], paidCards: true });
  resetPostcardLink.mockResolvedValue({ postcard: { ...FRANCE, code: 'NEWC-ODE2-HERE' } });
  deletePostcard.mockResolvedValue({ deleted: true });
});

describe('AccountPostcardsSection', () => {
  it('lists the cards sent, each with its link', async () => {
    render(<AccountPostcardsSection />);
    await waitFor(() => expect(row('pc-rome')).not.toBeNull());
    expect(row('pc-rome').textContent).toContain('A postcard from Colosseum');
    expect(row('pc-rome').textContent).toContain('To Sam · sent 24 November 2026');
    expect(row('pc-france').textContent).toContain('A postcard from France');
    expect(screen.getByLabelText('Link to your postcard to Sam').value).toMatch(/\/postcard\/PST2-CRD8-RMEC$/);
    expect(screen.getByLabelText('Link to your postcard').value).toMatch(/\/postcard\/PST2-CRD8-FRNC$/);
  });

  it('gives a card a new link once asked', async () => {
    render(<AccountPostcardsSection />);
    await waitFor(() => expect(row('pc-france')).not.toBeNull());
    fireEvent.click(screen.getByLabelText('New link for your postcard'));
    expect(row('pc-france').textContent).toContain('Anyone using the old one won’t be able to open the card any more.');
    await act(async () => fireEvent.click(screen.getByText('Make a new link')));
    expect(resetPostcardLink).toHaveBeenCalledWith('pc-france');
    expect(screen.getByLabelText('Link to your postcard').value).toMatch(/NEWC-ODE2-HERE$/);
    expect(screen.getByText('A new link is ready. The old one no longer works.')).toBeTruthy();
  });

  it('deletes a card once asked, or keeps it', async () => {
    render(<AccountPostcardsSection />);
    await waitFor(() => expect(row('pc-rome')).not.toBeNull());
    fireEvent.click(screen.getByLabelText('Delete your postcard to Sam'));
    fireEvent.click(screen.getByText('Keep it as it is'));
    expect(deletePostcard).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Delete your postcard to Sam'));
    expect(row('pc-rome').textContent).toContain('Anyone who downloaded it keeps their copy.');
    await act(async () => fireEvent.click(screen.getByText('Delete it')));
    expect(deletePostcard).toHaveBeenCalledWith('pc-rome');
    expect(row('pc-rome')).toBeNull();
  });

  it('says what went wrong with a change', async () => {
    deletePostcard.mockRejectedValueOnce({ friendlyMessage: 'Verify your email address first.' });
    render(<AccountPostcardsSection />);
    await waitFor(() => expect(row('pc-rome')).not.toBeNull());
    fireEvent.click(screen.getByLabelText('Delete your postcard to Sam'));
    await act(async () => fireEvent.click(screen.getByText('Delete it')));
    expect(screen.getByText('Verify your email address first.')).toBeTruthy();
    expect(row('pc-rome')).not.toBeNull();
  });

  it('locks the changes while the email address is unverified', async () => {
    useMustVerifyEmail.mockReturnValue(true);
    render(<AccountPostcardsSection />);
    await waitFor(() => expect(row('pc-rome')).not.toBeNull());
    expect(screen.getByLabelText('Delete your postcard to Sam').disabled).toBe(true);
    useMustVerifyEmail.mockReturnValue(false);
  });

  it('says how to send one when there are none, and when the list couldn’t load', async () => {
    getMyPostcards.mockResolvedValueOnce({ postcards: [], paidCards: false });
    const { unmount } = render(<AccountPostcardsSection />);
    await waitFor(() => expect(screen.getByText(/You haven’t sent a postcard yet/)).toBeTruthy());
    unmount();
    getMyPostcards.mockRejectedValueOnce({ friendlyMessage: 'Offline.' });
    render(<AccountPostcardsSection />);
    await waitFor(() => expect(screen.getByText('Offline.')).toBeTruthy());
  });
});
