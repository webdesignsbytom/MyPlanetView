// "Share a slideshow" (components/shows/; 25 Nov 2026, the user's wish; docs/API.md "Photo
// slideshows"): choose photos, a title, the order and the speed, then get the link
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ShowMakerDialog from '@/components/shows/ShowMakerDialog';
import ShareShow from '@/components/shows/ShareShow';
import { createPhotoShow } from '@/api/photoShowsApi';
import usePhotoPage from '@/hooks/usePhotoPage';

vi.mock('@/api/photoShowsApi', () => ({ createPhotoShow: vi.fn() }));
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));

const PHOTOS = [
  { id: 'p-new', thumbUrl: '/n.jpg', takenAt: '2025-08-01T10:00:00.000Z', caption: 'Beach' },
  { id: 'p-old', thumbUrl: '/o.jpg', takenAt: '2019-03-01T10:00:00.000Z', caption: 'Castle' },
  { id: 'p-hidden', thumbUrl: '/h.jpg', takenAt: '2020-01-01T10:00:00.000Z', caption: 'Secret', hidden: true },
  { id: 'v-1', kind: 'VIDEO', thumbUrl: '/v.jpg', takenAt: null, caption: 'Waves', durationS: 30 },
];
const SHOW = { id: 's1', code: 'SPN2-SHW8-TRP5', title: 'Portugal', seconds: 8, photoIds: ['p-old', 'p-new'], photoCount: 2 };

const tile = (id) => document.querySelector(`[data-show-photo="${id}"]`);
const makeButton = () => screen.getByText('Make the link').closest('button');

let more;
beforeEach(() => {
  vi.clearAllMocks();
  more = vi.fn();
  usePhotoPage.mockReturnValue({ photos: PHOTOS, loading: false, error: null, nextCursor: 'c1', loadMore: more });
  createPhotoShow.mockResolvedValue({ show: SHOW });
});

const open = (props = {}) => {
  const onClose = vi.fn();
  render(<ShowMakerDialog mapId='map-1' source={{ mapId: 'map-1', country: 'PT', display: true }} defaultTitle='Portugal' onClose={onClose} {...props} />);
  return { onClose };
};

describe('ShowMakerDialog', () => {
  it('lists the photos to choose from the gallery it was opened from, its title filled in', () => {
    open();
    expect(document.querySelector('[role="dialog"]').textContent).toContain('Share a slideshow');
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

  it('ticks photos and makes the link, oldest first by default, at the speed chosen', async () => {
    open();
    fireEvent.click(tile('p-new'));
    fireEvent.click(tile('p-old'));
    expect(tile('p-new').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('2 chosen')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Each photo stays up for'), { target: { value: '8' } });
    fireEvent.click(makeButton());
    await waitFor(() => expect(createPhotoShow).toHaveBeenCalled());
    expect(createPhotoShow).toHaveBeenCalledWith('map-1', { title: 'Portugal', photoIds: ['p-old', 'p-new'], seconds: 8 });
    // Made: its link to copy or open
    expect(await screen.findByText(/“Portugal” is ready: 2 photos/)).toBeTruthy();
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
    createPhotoShow.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'A map can have 100 slideshows.' }));
    open();
    fireEvent.click(tile('p-old'));
    fireEvent.click(makeButton());
    expect(await screen.findByText('A map can have 100 slideshows.')).toBeTruthy();
    expect(screen.getByLabelText('Title')).toBeTruthy();
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
    render(<ShareShow mapId='map-1' source={{ tripId: 't1', display: true }} defaultTitle='Lisbon' />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(screen.getByText('Share a slideshow').closest('button'));
    expect(await screen.findByLabelText('Title')).toBeTruthy();
    expect(screen.getByLabelText('Title').value).toBe('Lisbon');
  });
});
