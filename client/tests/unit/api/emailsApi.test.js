import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { getEmailPreferences, saveEmailPreferences, unsubscribeFromEmails } from '@/api/emailsApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('emailsApi', () => {
  it('reads the email preferences', async () => {
    client.answerWith({ onThisDay: true });
    await expect(getEmailPreferences()).resolves.toEqual({ onThisDay: true });
    expect(client.get).toHaveBeenCalledWith('/api/users/email-preferences');
  });

  it('saves them', async () => {
    client.answerWith({ onThisDay: false });
    await expect(saveEmailPreferences({ onThisDay: false })).resolves.toEqual({ onThisDay: false });
    expect(client.put).toHaveBeenCalledWith('/api/users/email-preferences', { onThisDay: false });
  });

  it('sends an email’s unsubscribe link', async () => {
    await unsubscribeFromEmails({ u: 'user-1', t: 'token' });
    expect(client.post).toHaveBeenCalledWith('/api/emails/unsubscribe', { u: 'user-1', t: 'token' });
  });
});
