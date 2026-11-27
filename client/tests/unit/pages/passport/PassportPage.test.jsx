import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import PassportPage from '@/pages/passport/PassportPage';
import { getPassport, updateMap } from '@/api/travelApi';
import { MAP_PASSPORT_PAGE_URL, SHARED_PASSPORT_PAGE_URL } from '@/utils/constants/routes';
import { headings, here, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ getPassport: vi.fn(), updateMap: vi.fn() }));
// The book is PassportBook's own test's: a stand-in with its callback, saying what else it got
vi.mock('@/components/passport/PassportBook', () => ({
  default: ({ passport, onOpenPhoto, openAt, travellerEdit, ...rest }) => (
    <div
      data-book={passport.map.name}
      data-open-at={openAt ?? ''}
      data-props={Object.keys(rest).sort().join(',')}
      data-edit={travellerEdit ? (travellerEdit.locked ? 'locked' : 'on') : 'off'}
      data-travellers={passport.travellers.map((t) => `${t.id}:${t.signature ?? ''}`).join(',')}
      data-traveller-names={passport.travellers.map((t) => `${t.id}:${[t.name, t.lastName].filter(Boolean).join(' ')}`).join(',')}
      data-cover={passport.map.passportColour ?? ''}
    >
      <button type='button' onClick={() => onOpenPhoto('photo-1')}>
        Open a stamp’s photo
      </button>
      {travellerEdit ? (
        <>
          <button type='button' onClick={() => travellerEdit.onEditPhoto(passport.travellers[0])}>
            Edit a photo
          </button>
          <button type='button' onClick={() => travellerEdit.onEditSignature(passport.travellers[0])}>
            Edit a signature
          </button>
        </>
      ) : null}
    </div>
  ),
}));
// A traveller's photo and signature dialogs (their own tests): stand-ins that save
vi.mock('@/components/passport/TravellerPhotoDialog', () => ({
  default: ({ mapId, traveller, onSaved, onClose }) => (
    <div role='dialog' data-photo-dialog={`${mapId}:${traveller.id}`}>
      <button type='button' onClick={() => onSaved({ ...traveller, photo: { source: 'MAP' } })}>
        Save it
      </button>
      <button type='button' onClick={onClose}>
        Close it
      </button>
    </div>
  ),
}));
vi.mock('@/components/passport/TravellerSignatureDialog', () => ({
  default: ({ traveller, onSaved, onClose }) => (
    <div role='dialog' data-signature-dialog={traveller.id}>
      <button
        type='button'
        onClick={() => {
          onSaved({ ...traveller, signature: 'M1 1L2 2' });
          onClose();
        }}
      >
        Sign it
      </button>
    </div>
  ),
}));
// The details card under the book (tested on its own): where it shows, and what its saves do
vi.mock('@/components/passport/PassportDetailsCard', () => ({
  default: ({ mapId, travellers, locked, onSaved }) => (
    <div data-details-card={`${mapId}:${travellers.map((t) => t.id).join(',')}`} data-locked={String(locked)}>
      <button type='button' onClick={() => onSaved([{ id: 'trav-1', name: 'Charles', lastName: 'Reid' }], { birthplaceChanged: false })}>
        Save a name
      </button>
      <button type='button' onClick={() => onSaved([{ id: 'trav-1', birthCountryCode: 'IE' }], { birthplaceChanged: true })}>
        Save a birthplace
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

  // 25 Nov 2026, the user's wish: a traveller's passport photo and signature
  describe('a traveller’s photo and signature', () => {
    const editable = () => passport({ map: { id: 'map-1', name: 'Our map', groupType: 'COUPLE', traveller: null, canEdit: true }, travellers: [{ id: 'trav-1', name: 'Charlie' }] });

    it('lets the map’s editors change them, saved into the book at once', async () => {
      getPassport.mockResolvedValue({ passport: editable() });
      openOwn();
      await waitFor(() => expect(book().getAttribute('data-edit')).toBe('on'));
      fireEvent.click(screen.getByText('Edit a photo'));
      await screen.findByText('Save it');
      expect(document.querySelector('[data-photo-dialog]').getAttribute('data-photo-dialog')).toBe('map-1:trav-1');
      fireEvent.click(screen.getByText('Close it'));
      expect(document.querySelector('[data-photo-dialog]')).toBeNull();
      fireEvent.click(screen.getByText('Edit a signature'));
      fireEvent.click(await screen.findByText('Sign it'));
      await waitFor(() => expect(book().getAttribute('data-travellers')).toBe('trav-1:M1 1L2 2'));
      expect(document.querySelector('[data-signature-dialog]')).toBeNull();
    });

    it('locks them for an unverified address', async () => {
      getPassport.mockResolvedValue({ passport: editable() });
      renderPage(<PassportPage />, { path: MAP_PASSPORT_PAGE_URL, at: '/maps/map-1/passport', auth: signedIn({ emailVerified: false }) });
      await waitFor(() => expect(book().getAttribute('data-edit')).toBe('locked'));
    });

    it('never through a share link, nor for a viewer', async () => {
      getPassport.mockResolvedValue({ passport: editable() });
      openShared();
      await waitFor(() => expect(book()).toBeTruthy());
      expect(book().getAttribute('data-edit')).toBe('off');
    });

    it('not for someone who only views the map', async () => {
      getPassport.mockResolvedValue({ passport: { ...editable(), map: { ...editable().map, canEdit: false } } });
      openOwn();
      await waitFor(() => expect(book()).toBeTruthy());
      expect(book().getAttribute('data-edit')).toBe('off');
    });
  });

  // 27 Nov 2026, the user's wish: "below the passport we should have a edit data container for
  // the peoples info"
  describe('the travellers’ details', () => {
    const editable = () => passport({ map: { id: 'map-1', name: 'Our map', groupType: 'COUPLE', traveller: null, canEdit: true }, travellers: [{ id: 'trav-1', name: 'Charlie' }] });
    const card = () => document.querySelector('[data-details-card]');

    it('are under the book for the map’s editors, every traveller, locked for an unverified address', async () => {
      getPassport.mockResolvedValue({ passport: editable() });
      const { unmount } = openOwn();
      await waitFor(() => expect(card()).toBeTruthy());
      expect(card().getAttribute('data-details-card')).toBe('map-1:trav-1');
      expect(card().getAttribute('data-locked')).toBe('false');
      // Below the book
      expect(book().compareDocumentPosition(card()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      unmount();
      renderPage(<PassportPage />, { path: MAP_PASSPORT_PAGE_URL, at: '/maps/map-1/passport', auth: signedIn({ emailVerified: false }) });
      await waitFor(() => expect(card()?.getAttribute('data-locked')).toBe('true'));
    });

    it('aren’t offered through a share link or to a viewer', async () => {
      getPassport.mockResolvedValue({ passport: editable() });
      const { unmount } = openShared();
      await waitFor(() => expect(book()).toBeTruthy());
      expect(card()).toBeNull();
      unmount();
      getPassport.mockResolvedValue({ passport: { ...editable(), map: { ...editable().map, canEdit: false } } });
      openOwn();
      await waitFor(() => expect(book()).toBeTruthy());
      expect(card()).toBeNull();
    });

    it('go into the book at once when saved, and a new birthplace reads the passport again', async () => {
      getPassport.mockResolvedValue({ passport: editable() });
      openOwn();
      await waitFor(() => expect(card()).toBeTruthy());
      fireEvent.click(screen.getByText('Save a name'));
      await waitFor(() => expect(book().getAttribute('data-traveller-names')).toBe('trav-1:Charles Reid'));
      expect(getPassport).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByText('Save a birthplace'));
      await waitFor(() => expect(getPassport).toHaveBeenCalledTimes(2));
      expect(getPassport).toHaveBeenLastCalledWith({ mapId: 'map-1' }, { travellerId: null });
    });
  });

  // 26 Nov 2026, the user's wish: "add choosing passport colour, just the cover colour"
  describe('the cover’s colour', () => {
    const ownable = (over = {}) =>
      passport({ map: { id: 'map-1', name: 'Our map', groupType: 'COUPLE', traveller: null, plan: { id: 'FREE' }, passportColour: null, canChooseCover: true, ...over } });
    const swatch = (id) => document.querySelector(`[data-cover-colour="${id}"] input`);

    it('lets the owner choose it under the book, shown at once and saved on the map', async () => {
      getPassport.mockResolvedValue({ passport: ownable() });
      updateMap.mockResolvedValue({ map: {} });
      openOwn();
      await waitFor(() => expect(swatch('BURGUNDY').checked).toBe(true));
      fireEvent.click(swatch('GREEN'));
      expect(book().getAttribute('data-cover')).toBe('GREEN');
      expect(updateMap).toHaveBeenCalledWith('map-1', { passportColour: 'GREEN' });
      await waitFor(() => expect(swatch('GREEN').disabled).toBe(false));
    });

    it('puts it back, saying why, when it can’t be saved', async () => {
      getPassport.mockResolvedValue({ passport: ownable({ passportColour: 'TAN' }) });
      updateMap.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
      openOwn();
      await waitFor(() => expect(book().getAttribute('data-cover')).toBe('TAN'));
      fireEvent.click(swatch('BLUE'));
      expect(await screen.findByRole('alert')).toBeTruthy();
      expect(screen.getByRole('alert').textContent).toBe('Offline.');
      expect(book().getAttribute('data-cover')).toBe('TAN');
    });

    it('isn’t offered to anyone else, nor through a share link', async () => {
      getPassport.mockResolvedValue({ passport: ownable({ canChooseCover: false }) });
      const { unmount } = openOwn();
      await waitFor(() => expect(book()).toBeTruthy());
      expect(document.querySelector('[data-cover-colour]')).toBeNull();
      unmount();
      getPassport.mockResolvedValue({ passport: ownable() });
      openShared();
      await waitFor(() => expect(book()).toBeTruthy());
      expect(document.querySelector('[data-cover-colour]')).toBeNull();
    });
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
