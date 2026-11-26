// A map's slideshows in its share dialog (components/shows/MapShowsSection.jsx; 25 Nov 2026)
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MapShowsSection from '@/components/shows/MapShowsSection';
import { deletePhotoShow, getMapPhotoShows, resetPhotoShowLink, updatePhotoShow } from '@/api/photoShowsApi';

vi.mock('@/api/photoShowsApi', () => ({
  getMapPhotoShows: vi.fn(),
  updatePhotoShow: vi.fn(),
  resetPhotoShowLink: vi.fn(),
  deletePhotoShow: vi.fn(),
}));

const SHOW = { id: 's1', code: 'SPN2-SHW8-TRP5', title: 'Our favourite photos', seconds: 5, photoIds: ['a', 'b', 'c'], photoCount: 3, createdAt: '2026-11-22T10:00:00.000Z' };
const row = () => document.querySelector('[data-photo-show="s1"]');
const button = (text) => screen.getByText(text).closest('button');

beforeEach(() => {
  vi.clearAllMocks();
  getMapPhotoShows.mockResolvedValue({ shows: [SHOW] });
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

  it('says how to make one when there are none, and why it couldn’t load', async () => {
    getMapPhotoShows.mockResolvedValueOnce({ shows: [] });
    const { unmount } = render(<MapShowsSection mapId='map-1' />);
    expect(await screen.findByText(/No slideshows yet/)).toBeTruthy();
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
