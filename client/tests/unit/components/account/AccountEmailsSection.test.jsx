import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountEmailsSection from '@/components/account/AccountEmailsSection';
import { getEmailPreferences, saveEmailPreferences } from '@/api/emailsApi';

vi.mock('@/api/emailsApi', () => ({ getEmailPreferences: vi.fn(), saveEmailPreferences: vi.fn() }));

const box = () => screen.getByLabelText(/On this day/);

describe('AccountEmailsSection', () => {
  beforeEach(() => vi.resetAllMocks());

  it('is locked until the settings arrive, then shows them', async () => {
    let answer;
    getEmailPreferences.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    render(<AccountEmailsSection />);
    expect(box().disabled).toBe(true);
    expect(box().checked).toBe(false);
    answer({ onThisDay: true });
    await waitFor(() => expect(box().disabled).toBe(false));
    expect(box().checked).toBe(true);
    expect(screen.getByText(/always come/)).toBeTruthy();
  });

  it('says so when the settings couldn’t be loaded, and stays locked', async () => {
    getEmailPreferences.mockRejectedValue(new Error('no'));
    render(<AccountEmailsSection />);
    expect(await screen.findByText('Your email settings couldn’t be loaded.')).toBeTruthy();
    expect(box().disabled).toBe(true);
  });

  it('saves a change as it’s made', async () => {
    getEmailPreferences.mockResolvedValue({ onThisDay: true });
    let saved;
    saveEmailPreferences.mockReturnValue(new Promise((resolve) => (saved = resolve)));
    const { container } = render(<AccountEmailsSection />);
    await waitFor(() => expect(box().checked).toBe(true));
    fireEvent.click(box());
    expect(saveEmailPreferences).toHaveBeenCalledWith({ onThisDay: false });
    expect(box().checked).toBe(false);
    const status = container.querySelector('[aria-live="polite"]');
    expect(status.textContent).toBe('Saving…');
    saved({ onThisDay: false });
    await waitFor(() => expect(status.textContent).toBe('Saved.'));
    expect(box().checked).toBe(false);
  });

  it('puts the box back and says why when the save fails', async () => {
    getEmailPreferences.mockResolvedValue({ onThisDay: false });
    saveEmailPreferences.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Not now.' }));
    render(<AccountEmailsSection />);
    await waitFor(() => expect(box().disabled).toBe(false));
    fireEvent.click(box());
    const message = await screen.findByText('Not now.');
    expect(message.className).toContain('text-status-critical');
    expect(box().checked).toBe(false);
  });

  it('switches "Welcome home" (the reminder after a trip) on its own', async () => {
    getEmailPreferences.mockResolvedValue({ onThisDay: true, tripShare: true });
    saveEmailPreferences.mockResolvedValue({ onThisDay: true, tripShare: false });
    render(<AccountEmailsSection />);
    const welcome = () => screen.getByLabelText(/Welcome home/);
    await waitFor(() => expect(welcome().checked).toBe(true));
    expect(screen.getByText('The day after a trip ends, a reminder to share it with your friends.')).toBeTruthy();
    fireEvent.click(welcome());
    expect(saveEmailPreferences).toHaveBeenCalledWith({ tripShare: false });
    expect(await screen.findByText('Saved.')).toBeTruthy();
    expect(welcome().checked).toBe(false);
    expect(box().checked).toBe(true);
  });

  it('counts a setting the server leaves out as on, as an account with no profile yet', async () => {
    getEmailPreferences.mockResolvedValue({ onThisDay: false });
    render(<AccountEmailsSection />);
    await waitFor(() => expect(box().disabled).toBe(false));
    expect(box().checked).toBe(false);
    expect(screen.getByLabelText(/Welcome home/).checked).toBe(true);
  });

  it('has a fallback wording for a failed save', async () => {
    getEmailPreferences.mockResolvedValue({ onThisDay: true });
    saveEmailPreferences.mockRejectedValue(new Error('no'));
    render(<AccountEmailsSection />);
    await waitFor(() => expect(box().checked).toBe(true));
    fireEvent.click(box());
    expect(await screen.findByText('That couldn’t be saved. Please try again.')).toBeTruthy();
    expect(box().checked).toBe(true);
  });
});
