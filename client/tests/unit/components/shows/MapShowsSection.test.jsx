// A map's saved slideshows, in its share dialog and the photo album's "Saved slideshows"
// (components/shows/MapShowsSection.jsx, SavedShows.jsx; 25 Nov 2026, saved 27 Nov 2026)
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MapShowsSection from '@/components/shows/MapShowsSection';
import SavedShows from '@/components/shows/SavedShows';
import { deletePhotoShow, getMapPhotoShows, resetPhotoShowLink, updatePhotoShow } from '@/api/photoShowsApi';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';

vi.mock('@/api/photoShowsApi', () => ({
  getMapPhotoShows: vi.fn(),
  updatePhotoShow: vi.fn(),
  resetPhotoShowLink: vi.fn(),
  deletePhotoShow: vi.fn(),
}));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));
// The slideshow itself (tested on its own): what it was asked to play
vi.mock('@/components/map/lazyMapPanels', () => ({
  Slideshow: ({ source, title, intro, photoCount, startSpeed, onClose }) => (
    <div data-test-slideshow={JSON.stringify({ source, title, intro, photoCount, startSpeed })}>
      <button type='button' onClick={onClose}>
        Close the test slideshow
      </button>
    </div>
  ),
}));

const SHOW = { id: 's1', code: 'SPN2-SHW8-TRP5', title: 'Our favourite photos', seconds: 5, photoIds: ['a', 'b', 'c'], photoCount: 3, createdAt: '2026-11-22T10:00:00.000Z' };
const row = () => document.querySelector('[data-photo-show="s1"]');
const button = (text) => screen.getByText(text).closest('button');

beforeEach(() => {
  vi.clearAllMocks();
  getMapPhotoShows.mockResolvedValue({ shows: [SHOW], limit: 10, plan: 'REGULAR' });
});

describe('MapShowsSection', () => {
  it('lists the map’s shows, each with its size and its link', async () => {
    render(<MapShowsSection mapId='map-1' />);
    await waitFor(() => expect(row()).toBeTruthy());
    expect(getMapPhotoShows).toHaveBeenCalledWith('map-1');
    expect(row().textContent).toContain('Our favourite photos');
    expect(row().textContent).toContain('3 photos · made 22 Nov 2026');
    expect(screen.getByLabelText('Link to Our favourite photos').value).toBe(`${window.location.origin}/show/SPN2-SHW8-TRP5`);
  });

  // 27 Nov 2026, the user's wish: 2, 10 or 25 saved a map, by its plan
  it('says how many are saved of what the map keeps, counting one deleted', async () => {
    deletePhotoShow.mockResolvedValue({ deleted: true });
    render(<MapShowsSection mapId='map-1' />);
    expect(await screen.findByText('1 of 10 saved on this map')).toBeTruthy();
    fireEvent.click(button('Delete'));
    fireEvent.click(button('Delete it'));
    expect(await screen.findByText('0 of 10 saved on this map')).toBeTruthy();
  });

  it('plays one over the page, as its link plays it', async () => {
    render(<MapShowsSection mapId='map-1' />);
    await waitFor(() => expect(row()).toBeTruthy());
    expect(document.querySelector('[data-test-slideshow]')).toBeNull();
    fireEvent.click(screen.getByLabelText('Play Our favourite photos'));
    const playing = await waitFor(() => {
      const found = document.querySelector('[data-test-slideshow]');
      expect(found).toBeTruthy();
      return found;
    });
    expect(JSON.parse(playing.getAttribute('data-test-slideshow'))).toEqual({
      source: { showCode: 'SPN2-SHW8-TRP5' },
      title: 'Our favourite photos',
      intro: 'Our favourite photos',
      photoCount: 3,
      startSpeed: 5,
    });
    // Over the whole page, not inside the list
    expect(row().contains(playing)).toBe(false);
    fireEvent.click(button('Close the test slideshow'));
    expect(document.querySelector('[data-test-slideshow]')).toBeNull();
  });

  it('says how to make one when there are none, and why it couldn’t load', async () => {
    getMapPhotoShows.mockResolvedValueOnce({ shows: [], limit: 2, plan: 'FREE' });
    const { unmount } = render(<MapShowsSection mapId='map-1' />);
    expect(await screen.findByText(/No slideshows saved yet/)).toBeTruthy();
    expect(screen.getByText(/choose “Make a slideshow” in the photo album/)).toBeTruthy();
    expect(screen.getByText('0 of 2 saved on this map')).toBeTruthy();
    unmount();
    getMapPhotoShows.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    render(<MapShowsSection mapId='map-1' />);
    expect(await screen.findByText('Offline.')).toBeTruthy();
  });

  it('renames one', async () => {
    updatePhotoShow.mockResolvedValue({ show: { ...SHOW, title: 'Best bits' } });
    render(<MapShowsSection mapId='map-1' />);
    await waitFor(() => expect(row()).toBeTruthy());
    fireEvent.click(button('Rename'));
    fireEvent.change(screen.getByLabelText('New title'), { target: { value: 'Best bits' } });
    fireEvent.click(button('Save'));
    await waitFor(() => expect(row().textContent).toContain('Best bits'));
    expect(updatePhotoShow).toHaveBeenCalledWith('s1', { title: 'Best bits' });
  });

  it('gives one a new link, after asking', async () => {
    resetPhotoShowLink.mockResolvedValue({ show: { ...SHOW, code: 'ABCD-EFGH-JKMN' } });
    render(<MapShowsSection mapId='map-1' />);
    await waitFor(() => expect(row()).toBeTruthy());
    fireEvent.click(button('New link'));
    expect(screen.getByText(/Anyone using the old one won’t be able to watch it/)).toBeTruthy();
    fireEvent.click(button('Make a new link'));
    expect(await screen.findByText('A new link is ready. The old one no longer works.')).toBeTruthy();
    expect(screen.getByLabelText('Link to Our favourite photos').value).toBe(`${window.location.origin}/show/ABCD-EFGH-JKMN`);
  });

  it('deletes one, after asking, and keeps it when told to', async () => {
    deletePhotoShow.mockResolvedValue({ deleted: true });
    render(<MapShowsSection mapId='map-1' />);
    await waitFor(() => expect(row()).toBeTruthy());
    fireEvent.click(button('Delete'));
    fireEvent.click(button('Keep it as it is'));
    expect(deletePhotoShow).not.toHaveBeenCalled();
    fireEvent.click(button('Delete'));
    expect(screen.getByText(/Its link stops working. Your photos stay on the map./)).toBeTruthy();
    fireEvent.click(button('Delete it'));
    await waitFor(() => expect(row()).toBeNull());
    expect(deletePhotoShow).toHaveBeenCalledWith('s1');
  });

  it('says why a change failed', async () => {
    deletePhotoShow.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Verify your email first.' }));
    render(<MapShowsSection mapId='map-1' />);
    await waitFor(() => expect(row()).toBeTruthy());
    fireEvent.click(button('Delete'));
    fireEvent.click(button('Delete it'));
    expect(await screen.findByText('Verify your email first.')).toBeTruthy();
  });

  it('locks the changes until the email address is verified, the link still there', async () => {
    render(<MapShowsSection mapId='map-1' locked />);
    await waitFor(() => expect(row()).toBeTruthy());
    expect(button('Rename').disabled).toBe(true);
    expect(button('New link').disabled).toBe(true);
    expect(button('Delete').disabled).toBe(true);
    expect(screen.getByLabelText('Copy the link to Our favourite photos').disabled).toBe(false);
  });
});

describe('SavedShows', () => {
  it('is the photo album’s button that opens the map’s saved slideshows, with no second heading', async () => {
    render(<SavedShows mapId='map-1' />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(button('Saved slideshows'));
    await waitFor(() => expect(row()).toBeTruthy());
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Saved slideshows');
    expect(dialog.querySelector('[aria-label="Saved slideshows"][data-map-shows]')).toBeTruthy();
    expect(dialog.querySelector('#photo-shows-heading')).toBeNull();
    expect(getMapPhotoShows).toHaveBeenCalledWith('map-1');
    expect(button('Rename').disabled).toBe(false);
  });

  it('locks the changes until the email address is verified', async () => {
    useMustVerifyEmail.mockReturnValue(true);
    render(<SavedShows mapId='map-1' />);
    fireEvent.click(button('Saved slideshows'));
    await waitFor(() => expect(row()).toBeTruthy());
    expect(button('Delete').disabled).toBe(true);
    useMustVerifyEmail.mockReturnValue(false);
  });
});
