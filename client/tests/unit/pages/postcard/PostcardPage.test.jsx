// A postcard's page (pages/postcard/PostcardPage.jsx; 26 Nov 2026; docs/API.md "Postcards")
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HeadProvider } from 'react-head';
import PostcardPage from '@/pages/postcard/PostcardPage';
import { openPostcard } from '@/api/postcardsApi';

vi.mock('@/api/postcardsApi', () => ({ openPostcard: vi.fn() }));
// The card is its own test's: here, what it's given
vi.mock('@/components/postcards/PostcardView', () => ({
  default: ({ card, downloads }) => <div data-test-view={JSON.stringify({ code: card.code, downloads })} />,
}));
vi.mock('@/components/common/AppPageShell', () => ({ default: ({ children }) => <main>{children}</main> }));

const CARD = { code: 'PST2-CRD8-FRNC', kind: 'COUNTRY', countryCode: 'FR', landmark: null, message: 'Bonjour!', toName: 'Gran', fromName: 'Charlie', sentAt: '2026-11-22T10:00:00.000Z' };

const visit = (code = 'PST2-CRD8-FRNC') =>
  render(
    <HeadProvider>
      <MemoryRouter initialEntries={[`/postcard/${code}`]}>
        <Routes>
          <Route path='/postcard/:code' element={<PostcardPage />} />
        </Routes>
      </MemoryRouter>
    </HeadProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  openPostcard.mockResolvedValue({ postcard: CARD });
});

describe('PostcardPage', () => {
  it('opens the card by its code: its place, who it’s to and from and the day, the card with its downloads', async () => {
    visit();
    expect(screen.getByText('Opening the postcard…')).toBeTruthy();
    expect(await screen.findByText('A postcard from France', { selector: 'h1' })).toBeTruthy();
    expect(openPostcard).toHaveBeenCalledWith('PST2-CRD8-FRNC');
    expect(screen.getByText('To Gran · from Charlie · 22 November 2026')).toBeTruthy();
    expect(JSON.parse(document.querySelector('[data-test-view]').getAttribute('data-test-view'))).toEqual({ code: 'PST2-CRD8-FRNC', downloads: true });
    expect(screen.getByText('Download both sides to keep it forever.')).toBeTruthy();
    expect(screen.getByText('Make your own travel map, free').getAttribute('href')).toBe('/sign-up?utm_source=postcard&utm_medium=postcard&utm_campaign=shared-postcard');
  });

  it('names a landmark’s card after its landmark', async () => {
    openPostcard.mockResolvedValue({ postcard: { ...CARD, kind: 'LANDMARK', landmark: { name: 'Colosseum' }, countryCode: 'IT', toName: null } });
    visit();
    expect(await screen.findByText('A postcard from Colosseum', { selector: 'h1' })).toBeTruthy();
    expect(screen.getByText('from Charlie · 22 November 2026')).toBeTruthy();
  });

  it('says when the card has gone, or couldn’t be opened', async () => {
    openPostcard.mockRejectedValueOnce({ response: { status: 404 } });
    const { unmount } = visit();
    expect((await screen.findByRole('alert')).textContent).toBe('This postcard isn’t there any more. Ask whoever sent it for a new link.');
    expect(screen.getByText('A postcard for you', { selector: 'h1' })).toBeTruthy();
    unmount();
    openPostcard.mockRejectedValueOnce({ friendlyMessage: 'Offline.' });
    visit();
    expect((await screen.findByRole('alert')).textContent).toBe('Offline.');
  });
});
