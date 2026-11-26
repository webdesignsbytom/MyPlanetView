// Postcards (api/postcardsApi.js; docs/API.md "Postcards")
import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { deletePostcard, getMyPostcards, openPostcard, presignPostcardPicture, resetPostcardLink, sendPostcard } from '@/api/postcardsApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('postcardsApi', () => {
  it('lists, presigns, sends, re-links and deletes the caller’s cards', async () => {
    client.answerWith({ postcards: [], paidCards: true });
    await expect(getMyPostcards()).resolves.toEqual({ postcards: [], paidCards: true });
    expect(client.get).toHaveBeenCalledWith('/api/postcards');
    await presignPostcardPicture({ contentType: 'image/webp', bytes: 10 });
    expect(client.post).toHaveBeenCalledWith('/api/postcards/picture/presign', { contentType: 'image/webp', bytes: 10 });
    await sendPostcard({ kind: 'COUNTRY', countryCode: 'FR', message: 'Hi' });
    expect(client.post).toHaveBeenCalledWith('/api/postcards', { kind: 'COUNTRY', countryCode: 'FR', message: 'Hi' });
    await resetPostcardLink('p 1');
    expect(client.post).toHaveBeenCalledWith('/api/postcards/p%201/reset-link');
    await deletePostcard('p1');
    expect(client.delete).toHaveBeenCalledWith('/api/postcards/p1');
  });

  it('opens one by its code', async () => {
    await openPostcard('PST2-CRD8-FRNC');
    expect(client.get).toHaveBeenCalledWith('/api/postcard/PST2-CRD8-FRNC');
  });
});
