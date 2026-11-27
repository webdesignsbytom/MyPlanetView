// "Make a slideshow" (components/shows/; 25 Nov 2026, the user's wish; saved since 27 Nov
// 2026; docs/API.md "Photo slideshows"): choose photos, a title, the order and the speed, then
// save it with its link, as many as the map's plan keeps
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShowMakerDialog from '@/components/shows/ShowMakerDialog';
import ShareShow from '@/components/shows/ShareShow';
import { createPhotoShow, getMapPhotoShows } from '@/api/photoShowsApi';
import usePhotoPage from '@/hooks/usePhotoPage';

vi.mock('@/api/photoShowsApi', () => ({ createPhotoShow: vi.fn(), getMapPhotoShows: vi.fn() }));
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));

const PHOTOS = [
  { id: 'p-new', thumbUrl: '/n.jpg', takenAt: '2025-08-01T10:00:00.000Z', caption: 'Beach' },
  { id: 'p-old', thumbUrl: '/o.jpg', takenAt: '2019-03-01T10:00:00.000Z', caption: 'Castle' },
  { id: 'p-hidden', thumbUrl: '/h.jpg', takenAt: '2020-01-01T10:00:00.000Z', caption: 'Secret', hidden: true },
  { id: 'v-1', kind: 'VIDEO', thumbUrl: '/v.jpg', takenAt: null, caption: 'Waves', durationS: 30 },
];
const SHOW = { id: 's1', code: 'SPN2-SHW8-TRP5', title: 'Portugal', seconds: 8, photoIds: ['p-old', 'p-new'], photoCount: 2 };

const tile = (id) => document.querySelector(`[data-show-photo="${id}"]`);
const makeButton = () => screen.getByText('Save the slideshow').closest('button');
const saved = (n, limit = 10, plan = 'REGULAR') => ({ shows: Array.from({ length: n }, (_, i) => ({ id: `s${i}` })), limit, plan });

let more;
beforeEach(() => {
  vi.clearAllMocks();
  more = vi.fn();
  usePhotoPage.mockReturnValue({ photos: PHOTOS, loading: false, error: null, nextCursor: 'c1', loadMore: more });
  createPhotoShow.mockResolvedValue({ show: SHOW });
  getMapPhotoShows.mockResolvedValue(saved(1));
});

const open = (props = {}) => {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <ShowMakerDialog mapId='map-1' source={{ mapId: 'map-1', country: 'PT', display: true }} defaultTitle='Portugal' onClose={onClose} {...props} />
    </MemoryRouter>,
  );
  return { onClose };
};

describe('ShowMakerDialog', () => {
  it('lists the photos to choose from the gallery it was opened from, its title filled in', () => {
    open();
    expect(document.querySelector('[role="dialog"]').textContent).toContain('Make a slideshow');
    expect(usePhotoPage).toHaveBeenCalledWith({ mapId: 'map-1', country: 'PT', display: true });
    expect(screen.getByLabelText('Title').value).toBe('Portugal');
    expect(screen.getByText('None chosen yet')).toBeTruthy();
    expect(makeButton().disabled).toBe(true);
    // A hidden photo can't go in, and says so
    expect(tile('p-hidden').disabled).toBe(true);
    expect(tile('p-hidden').textContent).toContain('hidden: it can’t go in a slideshow');
    // A video says what it is
    expect(tile('v-1').textContent).toContain('Video, 30 seconds: Waves');
    fireEvent.click(screen.getByText('Show more photos'));
    expect(more).toHaveBeenCalled();
  });

  it('ticks photos and saves it with its link, oldest first by default, at the speed chosen', async () => {
    open();
    fireEvent.click(tile('p-new'));
    fireEvent.click(tile('p-old'));
    expect(tile('p-new').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('2 chosen')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Each photo stays up for'), { target: { value: '8' } });
    fireEvent.click(makeButton());
    await waitFor(() => expect(createPhotoShow).toHaveBeenCalled());
    expect(createPhotoShow).toHaveBeenCalledWith('map-1', { title: 'Portugal', photoIds: ['p-old', 'p-new'], seconds: 8 });
    // Saved: its link to copy or open, and where it's kept
    expect(await screen.findByText(/“Portugal” is saved: 2 photos/)).toBeTruthy();
    expect(screen.getByText(/kept in the photo album’s “Saved slideshows”/)).toBeTruthy();
    expect(screen.getByLabelText('Link to Portugal').value).toBe(`${window.location.origin}/show/SPN2-SHW8-TRP5`);
    const openIt = screen.getByLabelText('Open Portugal (opens in a new tab)');
    expect(openIt.textContent).toBe('Open it');
    expect(openIt.getAttribute('target')).toBe('_blank');
  });

  it('plays them in the order chosen when asked, with the usual title for an empty one', async () => {
    open({ defaultTitle: '' });
    fireEvent.click(tile('p-new'));
    fireEvent.click(tile('v-1'));
    fireEvent.click(tile('p-old'));
    fireEvent.click(screen.getByLabelText('The order I chose them in'));
    fireEvent.click(makeButton());
    await waitFor(() => expect(createPhotoShow).toHaveBeenCalled());
    expect(createPhotoShow.mock.calls[0][1]).toEqual({ title: 'A slideshow', photoIds: ['p-new', 'v-1', 'p-old'], seconds: 5 });
  });

  it('chooses all it can and clears them, never a hidden one', () => {
    open();
    fireEvent.click(screen.getByText('Choose all'));
    expect(screen.getByText('3 chosen')).toBeTruthy();
    expect(tile('p-hidden').getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.getByText('None chosen yet')).toBeTruthy();
  });

  it('says why it couldn’t be made, and stays open', async () => {
    createPhotoShow.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Offline.' }));
    open();
    fireEvent.click(tile('p-old'));
    fireEvent.click(makeButton());
    expect(await screen.findByText('Offline.')).toBeTruthy();
    expect(screen.getByLabelText('Title')).toBeTruthy();
  });

  // 27 Nov 2026, the user's wish: 2, 10 or 25 saved a map, by its plan
  it('says how many the map has saved of what its plan keeps', async () => {
    open();
    expect((await screen.findByText('1 of 10 saved on this map')).hasAttribute('data-shows-saved')).toBe(true);
    expect(getMapPhotoShows).toHaveBeenCalledWith('map-1');
    // Saving one counts it
    fireEvent.click(tile('p-old'));
    fireEvent.click(makeButton());
    await screen.findByText('Make another');
    fireEvent.click(screen.getByText('Make another'));
    expect(screen.getByText('2 of 10 saved on this map')).toBeTruthy();
  });

  it('says so before anything is chosen once the map is full, and offers the plans below First Class', async () => {
    getMapPhotoShows.mockResolvedValue(saved(2, 2, 'FREE'));
    const { unmount } = render(
      <MemoryRouter>
        <ShowMakerDialog mapId='map-1' source={{ mapId: 'map-1' }} onClose={() => {}} />
      </MemoryRouter>,
    );
    const note = await waitFor(() => {
      const found = document.querySelector('[data-shows-full]');
      expect(found).toBeTruthy();
      return found;
    });
    expect(note.textContent).toContain('2 of 2 slideshows saved on this map. Delete one, or upgrade to save more.');
    expect(note.textContent).toContain('They’re in the photo album, under “Saved slideshows”.');
    expect(screen.getByText('See the plans').getAttribute('href')).toBe('/pricing');
    fireEvent.click(tile('p-old'));
    expect(makeButton().disabled).toBe(true);
    unmount();

    getMapPhotoShows.mockResolvedValue(saved(25, 25, 'PREMIUM'));
    open();
    await waitFor(() => expect(document.querySelector('[data-shows-full]')?.textContent).toContain('Delete one to save another.'));
    expect(screen.queryByText('See the plans')).toBeNull();
  });

  it('lets the server decide when the count can’t be read', async () => {
    getMapPhotoShows.mockRejectedValue(new Error('offline'));
    open();
    fireEvent.click(tile('p-old'));
    await waitFor(() => expect(getMapPhotoShows).toHaveBeenCalled());
    expect(document.querySelector('[data-shows-saved], [data-shows-full]')).toBeNull();
    expect(makeButton().disabled).toBe(false);
  });

  it('makes another, or closes', async () => {
    const { onClose } = open();
    fireEvent.click(tile('p-old'));
    fireEvent.click(makeButton());
    await screen.findByText('Make another');
    fireEvent.click(screen.getByText('Make another'));
    expect(screen.getByText('None chosen yet')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('copies the link, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    open();
    fireEvent.click(tile('p-old'));
    fireEvent.click(makeButton());
    fireEvent.click(await screen.findByLabelText('Copy the link to Portugal'));
    expect(await screen.findByText('Copied: paste it to whoever you like.')).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/show/SPN2-SHW8-TRP5`);
    delete navigator.clipboard;
  });
});

describe('ShareShow', () => {
  it('is a button that opens the maker over the page', async () => {
    render(
      <MemoryRouter>
        <ShareShow mapId='map-1' source={{ tripId: 't1', display: true }} defaultTitle='Lisbon' />
      </MemoryRouter>,
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(screen.getByText('Make a slideshow').closest('button'));
    expect(await screen.findByLabelText('Title')).toBeTruthy();
    expect(screen.getByLabelText('Title').value).toBe('Lisbon');
  });
});
