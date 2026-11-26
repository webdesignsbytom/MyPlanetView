import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import OneShotsPanel from '@/components/oneShots/OneShotsPanel';
import { withProviders } from '../map/helpers';
import usePhotoPage from '@/hooks/usePhotoPage';

// The photos' credits are their own chunk: none here, so the items show their binoculars
vi.mock('@/hooks/useOneShotPhotos', () => ({ default: () => null }));
// The map's photos to choose from, and an uploader that saves one photo when pressed
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
vi.mock('@/components/photos/PhotoUploader', () => ({
  default: ({ onUploaded, defaultCountryCode }) => (
    <button type='button' onClick={() => onUploaded({ id: 'new-1', kind: 'PHOTO', thumbUrl: '/new.webp' })}>
      {`Upload (${defaultCountryCode || 'no country'})`}
    </button>
  ),
}));

const TRAVELLERS = [
  { id: 'trav-test', name: 'Charlie' },
  { id: 'trav-alex', name: 'Alex' },
];
const PUFFIN = { id: 't1', itemKey: 'puffin', seenOn: '2013-06-01', datePrecision: 'MONTH', countryCode: 'IE', notes: 'On the Skelligs', travellerIds: ['trav-test'], photo: null };
const EQUATOR = { itemKey: 'equator', seenOn: '2019-03-02', from: 'FLIGHT', flight: { id: 'f1', fromAirport: 'LHR', toAirport: 'NBO', flownOn: '2019-03-02' } };

const open = (props = {}) => {
  const onSave = vi.fn().mockResolvedValue({ created: true });
  const onRemove = vi.fn().mockResolvedValue();
  const onClose = vi.fn();
  const oneShots = { oneShots: [PUFFIN], suggestions: [EQUATOR], loading: false, error: null, ...props.oneShots };
  const view = render(
    withProviders(
      <OneShotsPanel oneShots={oneShots} travellers={TRAVELLERS} onSave={onSave} onRemove={onRemove} onClose={onClose} {...props} />,
    ),
  );
  return { ...view, onSave, onRemove, onClose };
};
const card = (container, key) => container.querySelector(`[data-one-shot="${key}"]`);

const MAP_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => ({ id: `p${n}`, kind: 'PHOTO', caption: `Photo ${n}`, thumbUrl: `/p${n}.webp` }));

beforeEach(() => {
  vi.clearAllMocks();
  usePhotoPage.mockReturnValue({ photos: MAP_PHOTOS, loading: false, error: null, nextCursor: null, loadMore: vi.fn() });
});

describe('OneShotsPanel', { timeout: 20000 }, () => {
  it('is a map panel with the three lists as tabs, each with how far along it is', () => {
    const { container } = open();
    expect(screen.getByRole('heading', { level: 2, name: 'Life’s One Shots' })).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(container.querySelector('[data-one-shot-progress="WILDLIFE"]').textContent).toBe('1 of 80');
    expect(screen.getByText('1 of 80 animals.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Birds' })).toBeTruthy();
  });

  it('shows what’s ticked, and what isn’t yet, in words', () => {
    const { container } = open();
    expect(card(container, 'puffin').hasAttribute('data-ticked')).toBe(true);
    expect(card(container, 'puffin').textContent).toContain('Seen: June 2013, in Ireland');
    expect(card(container, 'lion').textContent).toContain('Not yet');
    expect(within(card(container, 'lion')).getByRole('button').getAttribute('aria-label')).toBe('Lion: not yet');
  });

  it('turns to another list with a tab, or the arrow keys', () => {
    open();
    fireEvent.click(screen.getByRole('tab', { name: /Nature’s wonders/ }));
    expect(screen.getByRole('heading', { name: 'Volcanoes' })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('tab', { name: /Nature’s wonders/ }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Journeys and feats/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Lines on the globe' })).toBeTruthy();
  });

  it('opens an item, and an editor ticks it with when, where and who', async () => {
    const { container, onSave } = open({ canEdit: true });
    fireEvent.click(within(card(container, 'lion')).getByRole('button'));
    const dialog = screen.getByRole('dialog', { name: 'Lion' });
    expect(dialog.textContent).toContain('Wildlife · On safari');
    expect(dialog.textContent).toContain('Not ticked yet on this map.');
    fireEvent.change(within(dialog).getByRole('combobox', { name: /Where/ }), { target: { value: 'KE' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Charlie' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tick it' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith('lion', { seenOn: null, datePrecision: null, countryCode: 'KE', travellerIds: ['trav-test'], photoIds: [], notes: null });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Lion' })).toBeNull());
  });

  it('changes and takes off a tick', async () => {
    const { container, onSave, onRemove } = open({ canEdit: true });
    fireEvent.click(within(card(container, 'puffin')).getByRole('button'));
    const dialog = screen.getByRole('dialog', { name: 'Atlantic puffin' });
    expect(dialog.querySelector('[data-one-shot-tick]').textContent).toContain('Seen: June 2013, in Ireland');
    expect(within(dialog).getByRole('textbox', { name: 'A note' }).value).toBe('On the Skelligs');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('puffin', expect.objectContaining({ seenOn: '2013-06-01', datePrecision: 'MONTH', countryCode: 'IE', notes: 'On the Skelligs' })));

    fireEvent.click(within(card(container, 'puffin')).getByRole('button'));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Atlantic puffin' })).getByRole('button', { name: 'Take it off' }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('puffin'));
  });

  it('says why a tick didn’t save', async () => {
    const { container, onSave } = open({ canEdit: true });
    onSave.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    fireEvent.click(within(card(container, 'lion')).getByRole('button'));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Lion' })).getByRole('button', { name: 'Tick it' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Offline.'));
  });

  it('offers what a flight crossed, filled in with its day and source', async () => {
    const { container, onSave } = open({ canEdit: true });
    const suggested = container.querySelector('[data-one-shot-suggestions]');
    expect(suggested.textContent).toContain('Across the equator');
    expect(suggested.textContent).toContain('Your flight from LHR to NBO, 2 Mar 2019');
    fireEvent.click(within(suggested).getByRole('button', { name: 'Tick Across the equator' }));
    const dialog = screen.getByRole('dialog', { name: 'Across the equator' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tick it' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('equator', expect.objectContaining({ seenOn: '2019-03-02', datePrecision: 'DAY', source: 'FLIGHT' })));
  });

  it('gives a viewer the lists to read: no suggestions, no form', () => {
    const { container } = open();
    expect(container.querySelector('[data-one-shot-suggestions]')).toBeNull();
    fireEvent.click(within(card(container, 'puffin')).getByRole('button'));
    const dialog = screen.getByRole('dialog', { name: 'Atlantic puffin' });
    expect(dialog.querySelector('[data-one-shot-form]')).toBeNull();
    expect(dialog.textContent).toContain('Charlie');
    expect(dialog.textContent).toContain('On the Skelligs');
  });

  it('tells an unverified editor why it’s locked', () => {
    const { container } = open({ canEdit: true, locked: true });
    expect(container.querySelector('[data-one-shot-suggestions]')).toBeNull();
    fireEvent.click(within(card(container, 'lion')).getByRole('button'));
    expect(screen.getByRole('dialog', { name: 'Lion' }).textContent).toContain('Verify your email address to tick Life’s One Shots');
  });

  it('shares a picture of the lists, only where it’s offered and something is ticked', () => {
    const onShareCard = vi.fn();
    open({ onShareCard });
    fireEvent.click(screen.getByRole('button', { name: 'Share a picture' }));
    expect(onShareCard).toHaveBeenCalled();
  });

  // 26 Nov 2026, the user's wish: "a photo/multiple photos of you with" it
  it('shows your own photo on the card and in the dialog, the others a press away', () => {
    const photos = [
      { id: 'p1', thumbUrl: '/t1.webp', displayUrl: '/d1.webp' },
      { id: 'p2', thumbUrl: '/t2.webp', displayUrl: '/d2.webp' },
    ];
    const { container } = open({ oneShots: { oneShots: [{ ...PUFFIN, photos, photo: photos[0] }], suggestions: [] } });
    expect(card(container, 'puffin').querySelector('[data-own-photo] img').getAttribute('src')).toBe('/t1.webp');
    expect(card(container, 'lion').querySelector('[data-own-photo]')).toBeNull();
    fireEvent.click(within(card(container, 'puffin')).getByRole('button'));
    const dialog = screen.getByRole('dialog', { name: 'Atlantic puffin' });
    const shown = within(dialog).getByRole('img', { name: 'Photo 1 of 2: Atlantic puffin' });
    expect(shown.getAttribute('src')).toBe('/d1.webp');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Show photo 2' }));
    expect(within(dialog).getByRole('img', { name: 'Photo 2 of 2: Atlantic puffin' }).getAttribute('src')).toBe('/d2.webp');
    // Not the Commons photo's credit: it isn't shown
    expect(dialog.textContent).not.toContain('Photo:');
  });

  it('lets an editor choose up to 5 photos, put another on the card and upload new ones', async () => {
    const uploaded = vi.fn();
    const { container, onSave } = open({ canEdit: true, photoSource: { mapId: 'm1' }, uploader: { mapId: 'm1', onUploaded: uploaded } });
    fireEvent.click(within(card(container, 'lion')).getByRole('button'));
    const dialog = screen.getByRole('dialog', { name: 'Lion' });
    expect(within(dialog).getByRole('group', { name: 'Photos of you with it' })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Choose photos' }));
    for (const n of [1, 2, 3, 4, 5]) fireEvent.click(within(dialog).getByRole('button', { name: `Photo ${n}` }));
    expect(within(dialog).getByRole('button', { name: 'Photo 6' }).disabled).toBe(true);
    expect(dialog.textContent).toContain('That’s the most: 5.');
    for (const n of [3, 4, 5]) fireEvent.click(within(dialog).getByRole('button', { name: `Photo ${n}` }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Done choosing photos' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Put photo 2 on the card' }));
    expect(dialog.textContent).toContain('The first is on its card');

    // A new photo uploaded here joins the tick, never a video
    fireEvent.change(within(dialog).getByRole('combobox', { name: /Where/ }), { target: { value: 'KE' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Upload new photos' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Upload (KE)' }));
    expect(uploaded).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-1' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tick it' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('lion', expect.objectContaining({ countryCode: 'KE', photoIds: ['p2', 'p1', 'new-1'] })));
  });

  it('keeps a tick’s photos when it’s changed, and offers no upload without the uploader', async () => {
    const photos = [{ id: 'p4', thumbUrl: '/p4.webp', displayUrl: '/p4d.webp' }];
    const { container, onSave } = open({ canEdit: true, photoSource: { mapId: 'm1' }, oneShots: { oneShots: [{ ...PUFFIN, photos, photo: photos[0] }], suggestions: [] } });
    fireEvent.click(within(card(container, 'puffin')).getByRole('button'));
    const dialog = screen.getByRole('dialog', { name: 'Atlantic puffin' });
    expect(within(dialog).queryByRole('button', { name: 'Upload new photos' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('puffin', expect.objectContaining({ photoIds: ['p4'] })));
  });

  it('opens one item at once, on its own list', () => {
    open({ focusKey: 'erupting-volcano' });
    expect(screen.getByRole('tab', { name: /Nature’s wonders/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'A volcano erupting' })).toBeTruthy();
  });
});
