import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ThemePhotoPicker from '@/components/themes/ThemePhotoPicker';
import usePhotoPage from '@/hooks/usePhotoPage';
import { enterPhotoInTheme, getThemeAlbumPage } from '@/api/themesApi';

vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
vi.mock('@/api/themesApi', () => ({ enterPhotoInTheme: vi.fn(), getThemeAlbumPage: vi.fn() }));

const PHOTOS = [
  { id: 'p-1', caption: 'Rain in Paris', thumbUrl: 'https://img/p1.jpg' },
  { id: 'p-2', caption: 'Fog in London' },
  { id: 'p-3', caption: 'Hail in Oslo' },
  { id: 'v-1', kind: 'VIDEO', caption: 'A storm' },
];
const THEME = { id: 'th-11', title: 'Worst weather', entriesLeft: 2 };

const page = (extra = {}) => {
  const loadMore = vi.fn();
  usePhotoPage.mockReturnValue({ photos: PHOTOS, loading: false, error: null, nextCursor: null, loadMore, ...extra });
  return loadMore;
};

const open = (theme = THEME) => {
  const onEntered = vi.fn();
  const onClose = vi.fn();
  render(<ThemePhotoPicker theme={theme} mapId='map-1' onEntered={onEntered} onClose={onClose} />);
  return { onEntered, onClose };
};

const tile = (label) => screen.getByText(label).closest('button');

describe('ThemePhotoPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getThemeAlbumPage.mockResolvedValue({ photos: [] });
  });

  it('is a dialog over the map’s photos, without videos', () => {
    page();
    open();
    expect(usePhotoPage).toHaveBeenCalledWith({ mapId: 'map-1', limit: 60 });
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Choose photos for “Worst weather”')).toBeTruthy();
    expect(screen.getByLabelText('Photos on the map').querySelectorAll('li').length).toBe(3);
    expect(screen.queryByText(/A storm/)).toBeNull();
    expect(screen.getByText(/2 more can go in this month/)).toBeTruthy();
  });

  it('marks the photos already in the theme, which can’t be picked again', async () => {
    page();
    getThemeAlbumPage.mockResolvedValue({ photos: [{ id: 'p-2' }] });
    open();
    expect(getThemeAlbumPage).toHaveBeenCalledWith({ mapId: 'map-1' }, 'th-11', { limit: 60 });
    await waitFor(() => expect(screen.getByText('Fog in London (already in the theme)')).toBeTruthy());
    expect(tile('Fog in London (already in the theme)').disabled).toBe(true);
    expect(tile('Fog in London (already in the theme)').getAttribute('aria-pressed')).toBe('true');
  });

  it('picks up to the room left, then greys out the rest', () => {
    page();
    open();
    const send = screen.getByText('Enter 0 photos').closest('button');
    expect(send.disabled).toBe(true);
    fireEvent.click(tile('Rain in Paris'));
    expect(tile('Rain in Paris').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Enter 1 photo')).toBeTruthy();
    fireEvent.click(tile('Fog in London'));
    expect(screen.getByText(/: 2 chosen/)).toBeTruthy();
    expect(tile('Hail in Oslo').disabled).toBe(true);
    // Picking one again lets it go
    fireEvent.click(tile('Rain in Paris'));
    expect(tile('Hail in Oslo').disabled).toBe(false);
  });

  it('enters each one, then closes', async () => {
    page();
    enterPhotoInTheme.mockResolvedValue({ themes: [] });
    const { onEntered, onClose } = open();
    fireEvent.click(tile('Rain in Paris'));
    fireEvent.click(tile('Hail in Oslo'));
    fireEvent.click(screen.getByText('Enter 2 photos'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(enterPhotoInTheme.mock.calls).toEqual([
      ['p-1', 'th-11'],
      ['p-3', 'th-11'],
    ]);
    expect(onEntered).toHaveBeenCalledTimes(1);
  });

  it('says which didn’t go in and stays open', async () => {
    page();
    enterPhotoInTheme.mockResolvedValueOnce({}).mockRejectedValueOnce(Object.assign(new Error('no'), { friendlyMessage: 'This map has entered 20.' }));
    const { onEntered, onClose } = open();
    fireEvent.click(tile('Rain in Paris'));
    fireEvent.click(tile('Fog in London'));
    fireEvent.click(screen.getByText('Enter 2 photos'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Some didn’t go in.');
    expect(alert.textContent).toContain('Fog in London: This map has entered 20.');
    expect(onEntered).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // The one that went in is now marked as in
    expect(screen.getByText('Rain in Paris (already in the theme)')).toBeTruthy();
  });

  it('pages on, and says when there are no photos or they failed', () => {
    const loadMore = page({ nextCursor: 'c-2' });
    const { unmount } = render(<ThemePhotoPicker theme={THEME} mapId='map-1' onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Show more photos'));
    expect(loadMore).toHaveBeenCalled();
    unmount();
    page({ photos: [] });
    open();
    expect(screen.getByText('No photos on this map yet.')).toBeTruthy();
  });

  it('shows a spinner while loading, and the error', () => {
    page({ photos: [], loading: true });
    const { unmount } = render(<ThemePhotoPicker theme={THEME} mapId='map-1' onClose={vi.fn()} />);
    expect(screen.getByText('Loading photos…')).toBeTruthy();
    unmount();
    page({ photos: [], error: 'Photos could not be loaded.' });
    open();
    expect(screen.getByText('Photos could not be loaded.')).toBeTruthy();
  });

  it('cancels', () => {
    page();
    const { onClose } = open();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
