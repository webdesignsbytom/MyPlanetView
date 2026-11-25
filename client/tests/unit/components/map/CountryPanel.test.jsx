import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CountryPanel from '@/components/map/CountryPanel';
import usePhotoPage from '@/hooks/usePhotoPage';
import useMomentPage from '@/hooks/useMomentPage';
import { getSubdivisions } from '@/api/travelApi';
import { SplitUkProvider } from '@/hooks/useSplitUk';
import { formatDay } from '@/utils/functions/dates';
import { todayDay } from '@/utils/map/celebrations';
import { stubMatchMedia, withProviders } from './helpers';

vi.mock('@/api/travelApi', () => ({ getSubdivisions: vi.fn() }));
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useMomentPage', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useGalleryOffers', () => ({ default: () => null }));
vi.mock('@/hooks/usePlannedTripPlace', () => ({ default: () => null }));
// The ticket's big parts have tests of their own: stand-ins that say what they got
vi.mock('@/components/moments/MomentList', () => ({
  default: ({ canEdit, emptyText, header, collapsed, bodyId }) => (
    <div data-moment-list data-can-edit={String(canEdit)} data-empty={emptyText} data-collapsed={String(collapsed)} data-body-id={bodyId}>
      {header}
    </div>
  ),
}));
vi.mock('@/components/photos/PhotoGrid', () => ({
  default: ({ photos, onOpen, onMove, emptyText }) => (
    <div data-photo-grid data-empty={emptyText} data-movable={String(Boolean(onMove))}>
      {photos.map((p) => (
        <button key={p.id} type='button' onClick={() => onOpen(p)}>
          {`photo ${p.id}`}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('@/components/photos/PrintDownload', () => ({ default: () => <span data-print-download /> }));
vi.mock('@/components/shows/ShareShow', () => ({ default: ({ mapId, source, defaultTitle }) => <span data-share-show={mapId} data-country={source.country} data-title={defaultTitle} /> }));
vi.mock('@/components/offers/TravelDesk', () => ({ default: ({ countryCodes }) => <span data-travel-desk={countryCodes.join(',')} /> }));
vi.mock('@/components/map/CountryLandmarks', () => ({ default: ({ countryCode }) => <span data-landmarks={countryCode} /> }));

const list = (items = []) => ({ photos: items, moments: items, loading: false, error: null, nextCursor: null, loadMore: vi.fn(), reload: vi.fn(), movePhoto: vi.fn() });

const open = (props = {}, { splitUk = false } = {}) => {
  const onSetVisit = vi.fn().mockResolvedValue({});
  const onClose = vi.fn();
  const result = render(
    withProviders(
      <SplitUkProvider value={splitUk}>
        <CountryPanel code='FR' visit={null} canEdit={false} onSetVisit={onSetVisit} photoSource={{ mapId: 'map-1' }} onOpenPhoto={vi.fn()} onClose={onClose} {...props} />
      </SplitUkProvider>,
    ),
  );
  const ticket = result.container.querySelector('[data-map-panel]');
  return { ...result, ticket, onSetVisit, onClose, stub: () => ticket?.querySelector('aside') };
};

let photos;
let moments;
beforeEach(() => {
  vi.clearAllMocks();
  photos = list();
  moments = list();
  usePhotoPage.mockImplementation(() => photos);
  useMomentPage.mockImplementation(() => moments);
  // Never answering, unless a test says otherwise, so no count lands after a test
  getSubdivisions.mockReturnValue(new Promise(() => {}));
  // Wide screens by default: the status controls sit in the stub
  stubMatchMedia((query) => query.startsWith('(min-width: 768px)'));
});

describe('CountryPanel', () => {
  it('shows nothing for a place it doesn’t know', () => {
    const { ticket } = open({ code: 'ZZ' });
    expect(ticket).toBeNull();
  });

  it('is the country’s ticket: its name, continent, poster and guide', () => {
    const { ticket } = open();
    expect(ticket.querySelector('h2').textContent).toBe('France');
    expect(ticket.textContent).toContain('Europe');
    expect(ticket.querySelector('aside a').getAttribute('href')).toBe('/countries/france');
  });

  it('tells a viewer how the map stands with it, and when they first went', () => {
    const { ticket } = open({ visit: { status: 'VISITED', firstVisitedOn: '2018-07-14' } });
    expect(ticket.textContent).toContain(`Visited, first on ${formatDay('2018-07-14')}`);
    expect(ticket.querySelector('select')).toBeNull();
    // Nor can they write a note
    expect(ticket.querySelector('textarea')).toBeNull();
  });

  it('puts an editor’s "Been there?" in the stub on wide screens, and saves a status', async () => {
    const { stub, onSetVisit } = open({ canEdit: true });
    const select = stub().querySelector('select');
    expect(select).not.toBeNull();
    fireEvent.change(select, { target: { value: 'LIVED' } });
    // Newly lived in: dated today (24 Nov 2026, the user's wish)
    await waitFor(() => expect(onSetVisit).toHaveBeenCalledWith('FR', 'LIVED', { firstVisitedOn: todayDay() }));
    fireEvent.change(select, { target: { value: '' } });
    await waitFor(() => expect(onSetVisit).toHaveBeenLastCalledWith('FR', null, undefined));
  });

  it('keeps the date a country has when it’s marked again, and dates no wish', async () => {
    const dated = open({ canEdit: true, visit: { status: 'WANT_TO_GO', firstVisitedOn: '2010-04-01' } });
    fireEvent.change(dated.stub().querySelector('select'), { target: { value: 'VISITED' } });
    await waitFor(() => expect(dated.onSetVisit).toHaveBeenCalledWith('FR', 'VISITED', { firstVisitedOn: '2010-04-01' }));
    dated.unmount();
    const wish = open({ canEdit: true });
    fireEvent.change(wish.stub().querySelector('select'), { target: { value: 'WANT_TO_GO' } });
    await waitFor(() => expect(wish.onSetVisit).toHaveBeenCalledWith('FR', 'WANT_TO_GO', { firstVisitedOn: undefined }));
  });

  it('makes the dropdown and the date a step slimmer in the stub only', () => {
    const wide = open({ canEdit: true, visit: { status: 'VISITED' } });
    expect(wide.stub().querySelector('[data-status-controls]').className).toContain('[&_.app-select]:py-1 [&_input]:py-1');
    wide.unmount();
    stubMatchMedia(() => false);
    const { ticket } = open({ canEdit: true, visit: { status: 'VISITED' } });
    expect(ticket.querySelector('[data-status-controls]').className).not.toContain('py-1');
  });

  it('puts the controls at the head of the content on phones', () => {
    stubMatchMedia(() => false);
    const { stub, ticket } = open({ canEdit: true });
    expect(stub().querySelector('select')).toBeNull();
    expect(ticket.querySelector('select')).not.toBeNull();
  });

  it('asks when they first went once visited, and keeps the date with a new status', async () => {
    const { ticket, onSetVisit } = open({ canEdit: true, visit: { status: 'VISITED', firstVisitedOn: '2018-07-14' } });
    const date = ticket.querySelector('input[type="date"]');
    expect(date.value).toBe('2018-07-14');
    fireEvent.change(ticket.querySelector('aside select'), { target: { value: 'LIVED' } });
    await waitFor(() => expect(onSetVisit).toHaveBeenCalledWith('FR', 'LIVED', { firstVisitedOn: '2018-07-14' }));
    fireEvent.click(screen.getByText('Clear date'));
    expect(onSetVisit).toHaveBeenLastCalledWith('FR', 'VISITED', { firstVisitedOn: null });
  });

  // The map page celebrates a first visit (24 Nov 2026): it hears of each new status saved here
  it('tells the map page of a status saved from the ticket, with what it was before', async () => {
    const onVisitMarked = vi.fn();
    const { ticket, onSetVisit } = open({ canEdit: true, visit: { status: 'WANT_TO_GO', firstVisitedOn: null }, onVisitMarked });
    fireEvent.change(ticket.querySelector('aside select'), { target: { value: 'VISITED' } });
    // Dated the day it's marked (24 Nov 2026, the user's wish), so the stamp is dated too
    await waitFor(() => expect(onVisitMarked).toHaveBeenCalledWith('FR', 'WANT_TO_GO', 'VISITED', todayDay()));
    expect(onSetVisit).toHaveBeenCalledTimes(1);
  });

  it('tells it nothing when only the date changes, or the save fails', async () => {
    const onVisitMarked = vi.fn();
    const { ticket, onSetVisit } = open({ canEdit: true, visit: { status: 'VISITED', firstVisitedOn: '2018-07-14' }, onVisitMarked });
    fireEvent.click(screen.getByText('Clear date'));
    await waitFor(() => expect(onSetVisit).toHaveBeenCalledTimes(1));
    onSetVisit.mockRejectedValue(new Error('offline'));
    fireEvent.change(ticket.querySelector('aside select'), { target: { value: 'LIVED' } });
    await waitFor(() => expect(ticket.querySelector('[role="alert"]')).not.toBeNull());
    expect(onVisitMarked).not.toHaveBeenCalled();
  });

  it('says why a status didn’t save', async () => {
    const { ticket, onSetVisit } = open({ canEdit: true });
    onSetVisit.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    fireEvent.change(ticket.querySelector('aside select'), { target: { value: 'VISITED' } });
    await waitFor(() => expect(ticket.querySelector('[role="alert"]').textContent).toBe('Offline.'));
  });

  it('lets an editor write a note only once the country has a status', () => {
    const { ticket } = open({ canEdit: true });
    expect(ticket.querySelector('textarea')).toBeNull();
    const marked = open({ canEdit: true, visit: { status: 'WANT_TO_GO', notes: 'Go in May' } });
    expect(marked.ticket.querySelector('textarea').value).toBe('Go in May');
  });

  it('saves a note with the visit’s status', async () => {
    const { ticket, onSetVisit } = open({ canEdit: true, visit: { status: 'WANT_TO_GO' } });
    fireEvent.change(ticket.querySelector('textarea'), { target: { value: 'Cherry blossom' } });
    fireEvent.click(screen.getByText('Save note'));
    await waitFor(() => expect(onSetVisit).toHaveBeenCalledWith('FR', 'WANT_TO_GO', { notes: 'Cherry blossom' }));
  });

  it('shows moments only once the country is visited, or has some already', () => {
    expect(open().ticket.querySelector('[data-moment-list]')).toBeNull();
    const visited = open({ visit: { status: 'VISITED' }, canEdit: true, mapId: 'map-1' });
    const momentList = visited.ticket.querySelector('[data-moment-list]');
    expect(momentList.getAttribute('data-empty')).toBe('No moments in France yet.');
    expect(momentList.getAttribute('data-can-edit')).toBe('true');
    moments = list([{ id: 'm1' }]);
    expect(open().ticket.querySelector('[data-moment-list]')).not.toBeNull();
  });

  it('folds the moments away with the arrow on their heading, the same on every ticket for the visit', () => {
    sessionStorage.clear();
    const first = open({ visit: { status: 'VISITED' } });
    const toggle = first.ticket.querySelector('[data-moments-toggle]');
    const momentList = first.ticket.querySelector('[data-moment-list]');
    // The heading is the button, and still names the section
    expect(toggle.closest('h3').id).toBe('moments-FR');
    expect(toggle.textContent).toBe('Moments');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe('moments-body-FR');
    expect(momentList.getAttribute('data-body-id')).toBe('moments-body-FR');
    expect(momentList.getAttribute('data-collapsed')).toBe('false');
    expect(toggle.querySelector('svg').getAttribute('class')).not.toContain('-rotate-90');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(momentList.getAttribute('data-collapsed')).toBe('true');
    expect(toggle.querySelector('svg').getAttribute('class')).toContain('-rotate-90');
    expect(sessionStorage.getItem('mpv:momentsClosed')).toBe('1');
    first.unmount();

    // Another ticket opens folded, and opening it again is remembered too
    const second = open({ code: 'IT', visit: { status: 'VISITED' } });
    const again = second.ticket.querySelector('[data-moments-toggle]');
    expect(again.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(again);
    expect(second.ticket.querySelector('[data-moment-list]').getAttribute('data-collapsed')).toBe('false');
    expect(sessionStorage.getItem('mpv:momentsClosed')).toBeNull();
  });

  it('lists the country’s photos, opening one with its gallery', () => {
    photos = list([{ id: 'p1' }]);
    const onOpenPhoto = vi.fn();
    const { ticket } = open({ onOpenPhoto });
    expect(usePhotoPage.mock.calls[0][0]).toMatchObject({ mapId: 'map-1', country: 'FR', enabled: true });
    expect(ticket.querySelector('[data-photo-grid]').getAttribute('data-empty')).toBe('No photos from France yet.');
    expect(ticket.querySelector('[data-photo-grid]').getAttribute('data-movable')).toBe('false');
    fireEvent.click(screen.getByText('photo p1'));
    expect(onOpenPhoto).toHaveBeenCalledWith({ id: 'p1' }, { filters: expect.objectContaining({ country: 'FR' }) });
  });

  it('plays, adds photos and plans a trip, for an editor', () => {
    photos = list([{ id: 'p1' }]);
    const onPlay = vi.fn();
    const onAddPhotos = vi.fn();
    const onPlanTrip = vi.fn();
    const { ticket } = open({ canEdit: true, onPlay, onAddPhotos, onPlanTrip });
    fireEvent.click(screen.getByText('Play slideshow'));
    fireEvent.click(screen.getByText('Add photos'));
    fireEvent.click(screen.getByText('Plan a trip'));
    expect(onPlay).toHaveBeenCalledWith('FR');
    expect(onAddPhotos).toHaveBeenCalledWith('FR');
    expect(onPlanTrip).toHaveBeenCalledWith('FR');
    expect(ticket.querySelector('[data-print-download]')).not.toBeNull();
    expect(ticket.querySelector('[data-travel-desk]').getAttribute('data-travel-desk')).toBe('FR');
  });

  it('puts the slideshow, adding photos and planning a trip above the photos, the download and desk below', () => {
    photos = list([{ id: 'p1' }]);
    const { ticket } = open({ canEdit: true, onPlay: vi.fn(), onAddPhotos: vi.fn(), onPlanTrip: vi.fn() });
    const actions = ticket.querySelector('[data-photo-actions]');
    expect([...actions.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Play slideshow', 'Add photos', 'Plan a trip']);
    const grid = ticket.querySelector('[data-photo-grid]');
    const before = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(before(actions, grid)).toBe(true);
    expect(actions.querySelector('[data-print-download], [data-travel-desk], [data-share-show]')).toBeNull();
    expect(before(grid, ticket.querySelector('[data-print-download]'))).toBe(true);
    // A slideshow of some of the country's photos, with its own link (25 Nov 2026), beside the download
    const share = ticket.querySelector('[data-share-show]');
    expect(before(grid, share)).toBe(true);
    expect(share.getAttribute('data-country')).toBe('FR');
    expect(share.getAttribute('data-title')).toBe('France');
    expect(before(grid, ticket.querySelector('[data-travel-desk]'))).toBe(true);
  });

  it('has no empty row over the photos when there’s nothing to press', () => {
    const { ticket } = open({ onPlay: vi.fn() });
    expect(ticket.querySelector('[data-photo-actions]')).toBeNull();
  });

  it('offers a viewer no editing, nor a slideshow without photos', () => {
    const { ticket } = open({ onPlay: vi.fn(), onAddPhotos: vi.fn(), onPlanTrip: vi.fn() });
    expect(screen.queryByText('Play slideshow')).toBeNull();
    expect(screen.queryByText('Add photos')).toBeNull();
    expect(screen.queryByText('Plan a trip')).toBeNull();
    expect(ticket.querySelector('[data-print-download]')).toBeNull();
    expect(ticket.querySelector('[data-share-show]')).toBeNull();
  });

  it('opens the country on its own map, counting the states visited', async () => {
    getSubdivisions.mockResolvedValue({ subdivisions: [{ status: 'VISITED' }, { status: 'WANT_TO_GO' }, { status: 'LIVED' }] });
    const onOpenCountryMap = vi.fn();
    const { ticket } = open({ onOpenCountryMap });
    const count = ticket.querySelector('[data-states-marked]');
    expect(count.textContent).toBe('0 of 103 departments visited');
    await waitFor(() => expect(ticket.querySelector('[data-states-marked]').textContent).toBe('2 of 103 departments visited'));
    expect(ticket.querySelector('[data-states-marked]').hasAttribute('aria-busy')).toBe(false);
    expect(getSubdivisions).toHaveBeenCalledWith({ mapId: 'map-1' }, 'FR');
    fireEvent.click(screen.getByLabelText('Open France on its own map'));
    expect(onOpenCountryMap).toHaveBeenCalledWith('FR');
  });

  it('gives a region its own visit, and its country’s photos and moments', async () => {
    const onOpenPlace = vi.fn();
    const onOpenCountryMap = vi.fn();
    const onPlanTrip = vi.fn();
    const { ticket } = open({ code: 'XB', canEdit: true, onOpenPlace, onOpenCountryMap, onPlay: vi.fn(), onAddPhotos: vi.fn(), onPlanTrip });
    expect(ticket.textContent).toContain('A region of Indonesia');
    expect(screen.getByText('Part of Indonesia')).toBeTruthy();
    expect(ticket.querySelector('[data-photo-grid]')).toBeNull();
    expect(ticket.querySelector('[data-moment-list]')).toBeNull();
    expect(usePhotoPage.mock.calls[0][0].enabled).toBe(false);
    expect(screen.queryByText('Add photos')).toBeNull();
    // No photos to sit above, so "Plan a trip" is in the row with the Travel Desk
    expect(ticket.querySelector('[data-photo-actions]')).toBeNull();
    fireEvent.click(screen.getByText('Plan a trip'));
    expect(onPlanTrip).toHaveBeenCalledWith('XB');
    expect(ticket.querySelector('[data-travel-desk]').getAttribute('data-travel-desk')).toBe('ID');
    fireEvent.click(screen.getByText('Open Indonesia'));
    expect(onOpenPlace).toHaveBeenCalledWith('ID');
    fireEvent.click(screen.getByLabelText('Open the map of Indonesia'));
    expect(onOpenCountryMap).toHaveBeenCalledWith('ID');
    await waitFor(() => expect(getSubdivisions).toHaveBeenCalledWith({ mapId: 'map-1' }, 'ID'));
  });

  it('marks a special place, and says a magnetic pole wanders', () => {
    const { ticket } = open({ code: 'QN' });
    expect(ticket.textContent).toContain('Special place');
    expect(ticket.textContent).toContain('The magnetic poles wander');
  });

  it('wears its badge once visited', () => {
    const { ticket } = open({ visit: { status: 'VISITED' } });
    expect(ticket.querySelector('header svg')).not.toBeNull();
  });

  it('says why it’s locked for an unverified address', () => {
    open({ locked: true });
    expect(screen.getByText(/to mark countries, write notes, plan trips, or add moments and photos/)).toBeTruthy();
  });

  it('shows changes made elsewhere on the page', () => {
    const { rerender } = render(
      withProviders(<CountryPanel code='FR' canEdit={false} onSetVisit={vi.fn()} photoSource={{ mapId: 'm' }} photosVersion={1} onClose={() => {}} />),
    );
    expect(photos.reload).not.toHaveBeenCalled();
    rerender(withProviders(<CountryPanel code='FR' canEdit={false} onSetVisit={vi.fn()} photoSource={{ mapId: 'm' }} photosVersion={2} onClose={() => {}} />));
    expect(photos.reload).toHaveBeenCalled();
    expect(moments.reload).toHaveBeenCalled();
  });

  it('asks which nations an old UK mark means, raising them and carrying the note and date to the first', async () => {
    const nations = { XC: { status: 'LIVED', notes: 'Edinburgh', firstVisitedOn: '2015-01-01' }, XE: null };
    const { onSetVisit, onClose, ticket } = open(
      { code: 'GB', canEdit: true, visit: { status: 'VISITED', notes: 'London calling', firstVisitedOn: '2010-05-05' }, visitOf: (c) => nations[c] ?? null },
      { splitUk: true },
    );
    // No status of its own to set: the nations are asked about instead
    expect(ticket.querySelector('aside select')).toBeNull();
    fireEvent.click(screen.getByLabelText('England'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    // (Splitting an old mark is no first visit: nothing to celebrate)
    expect(onSetVisit.mock.calls).toEqual([
      // Scotland, the first ticked: lived there already (never lowered), gets the note and the earlier date
      ['XC', 'LIVED', { notes: 'Edinburgh\n\nLondon calling', firstVisitedOn: '2010-05-05' }],
      ['XE', 'VISITED', undefined],
      ['GB', null],
    ]);
  });
});
