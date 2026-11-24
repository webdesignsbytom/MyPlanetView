import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import PassportPage from '@/pages/passport/PassportPage';
import { getPassport } from '@/api/travelApi';
import { MAP_PASSPORT_PAGE_URL, SHARED_PASSPORT_PAGE_URL } from '@/utils/constants/routes';
import { headings, here, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ getPassport: vi.fn() }));
// The book is PassportBook's own test's: a stand-in with its callback, saying what else it got
vi.mock('@/components/passport/PassportBook', () => ({
  default: ({ passport, onOpenPhoto, openAt, ...rest }) => (
    <div data-book={passport.map.name} data-open-at={openAt ?? ''} data-props={Object.keys(rest).sort().join(',')}>
      <button type='button' onClick={() => onOpenPhoto('photo-1')}>
        Open a stamp’s photo
      </button>
    </div>
  ),
}));
vi.mock('@/components/photos/PhotoViewer', () => ({ default: ({ photoId, shareCode }) => <div data-photo-viewer={photoId} data-share={shareCode ?? ''} /> }));

const passport = (over = {}) => ({
  map: { name: 'Charlie & Alex’s travels', groupType: 'COUPLE', traveller: null },
  travellers: [],
  pages: [{ stamps: [{ id: 's1', photoChosen: false }] }],
  ...over,
});
const status = (code) => Object.assign(new Error(String(code)), { response: { status: code } });

const openOwn = (at = '/maps/map-1/passport') => renderPage(<PassportPage />, { path: MAP_PASSPORT_PAGE_URL, at, auth: signedIn() });
const openShared = () => renderPage(<PassportPage />, { path: SHARED_PASSPORT_PAGE_URL, at: '/shared/ABCD-EFGH-JKMN/passport' });
const book = () => document.querySelector('[data-book]');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PassportPage', () => {
  it('has one main labelled by its h1, busy with a loading state while the passport opens', () => {
    getPassport.mockReturnValue(new Promise(() => {}));
    openOwn();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(headings()).toEqual(['Passport']);
    expect(document.getElementById(main.getAttribute('aria-labelledby')).tagName).toBe('H1');
    expect(main.getAttribute('aria-busy')).toBe('true');
    expect(main.querySelector('[role="status"]').textContent).toContain('Opening the passport…');
  });

  it('opens the map’s passport, named after the map, with a way back to it', async () => {
    getPassport.mockResolvedValue({ passport: passport() });
    openOwn();
    await waitFor(() => expect(book()).toBeTruthy());
    expect(getPassport).toHaveBeenCalledWith({ mapId: 'map-1' }, { travellerId: null });
    expect(headings()).toEqual(['Charlie & Alex’s travels']);
    expect(onlyMain().main.getAttribute('aria-busy')).toBeNull();
    expect(screen.getByText('Back to the map').getAttribute('href')).toBe('/maps/map-1');
    // Nobody picks a stamp's photo here (24 Nov 2026, the user's wish)
    expect(book().getAttribute('data-props')).toBe('');
    expect(screen.queryByText(/choose/i)).toBeNull();
  });

  // 24 Nov 2026, the user's wish: the celebration's "Open passport" names the new place in the
  // link's state, and the book opens from its cover straight to its page
  it('hands the book the place a celebration’s link named, and none otherwise', async () => {
    getPassport.mockResolvedValue({ passport: passport() });
    const { unmount } = openOwn({ pathname: '/maps/map-1/passport', state: { openAt: 'KE' } });
    await waitFor(() => expect(book()).toBeTruthy());
    expect(book().getAttribute('data-open-at')).toBe('KE');
    unmount();
    openOwn();
    await waitFor(() => expect(book()).toBeTruthy());
    expect(book().getAttribute('data-open-at')).toBe('');
  });

  it('opens a stamp’s photo in the viewer', async () => {
    getPassport.mockResolvedValue({ passport: passport() });
    openOwn();
    fireEvent.click(await screen.findByText('Open a stamp’s photo'));
    await waitFor(() => expect(document.querySelector('[data-photo-viewer="photo-1"]')).toBeTruthy());
  });

  it('through a share link: read only, back to the link', async () => {
    getPassport.mockResolvedValue({ passport: passport() });
    openShared();
    await waitFor(() => expect(book()).toBeTruthy());
    expect(getPassport).toHaveBeenCalledWith({ shareCode: 'ABCD-EFGH-JKMN' }, { travellerId: null });
    expect(screen.getByText('Back to the map').getAttribute('href')).toBe('/shared/ABCD-EFGH-JKMN');
  });

  it('a family’s map offers each traveller’s own passport, linked by ?traveller=', async () => {
    const travellers = [
      { id: 't1', name: 'Alex' },
      { id: 't2', name: 'Charlie' },
    ];
    getPassport.mockImplementation((_, { travellerId }) =>
      Promise.resolve({
        passport: passport({ map: { name: 'The Morgans', groupType: 'FAMILY', traveller: travellerId ? { id: 't2', name: 'Charlie' } : null }, travellers }),
      }),
    );
    openOwn('/maps/map-1/passport?traveller=t2');
    await waitFor(() => expect(headings()).toEqual(['Charlie’s passport']));
    expect(getPassport).toHaveBeenCalledWith({ mapId: 'map-1' }, { travellerId: 't2' });
    const group = document.querySelector('[role="group"][aria-label="Whose passport"]');
    const buttons = [...group.querySelectorAll('button')];
    expect(buttons.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['The whole family', 'false'],
      ['Alex', 'false'],
      ['Charlie', 'true'],
    ]);
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(here()).toBe('/maps/map-1/passport'));
    fireEvent.click(buttons[1]);
    await waitFor(() => expect(here()).toBe('/maps/map-1/passport?traveller=t1'));
  });

  it('says why a passport couldn’t be opened', async () => {
    getPassport.mockRejectedValue(status(404));
    const own = openOwn();
    expect(await screen.findByText('This map doesn’t exist, or it hasn’t been shared with you.')).toBeTruthy();
    expect(headings()).toEqual(['Passport']);
    own.unmount();
    const shared = openShared();
    expect(await screen.findByText('This link doesn’t work. It may have been reset, or sharing may have been turned off.')).toBeTruthy();
    shared.unmount();
    const gone = openOwn('/maps/map-1/passport?traveller=t9');
    expect(await screen.findByText('That traveller isn’t on this map any more.')).toBeTruthy();
    gone.unmount();
    getPassport.mockRejectedValue(Object.assign(status(500), { friendlyMessage: 'Server trouble.' }));
    openOwn();
    expect(await screen.findByText('Server trouble.')).toBeTruthy();
  });
});
