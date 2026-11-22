import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ThemeAlbumDialog from '@/components/themes/ThemeAlbumDialog';
import useThemeAlbum from '@/hooks/useThemeAlbum';
import { PhotoViewer } from '@/components/map/lazyMapPanels';

vi.mock('@/hooks/useThemeAlbum', () => ({ default: vi.fn() }));
// The photo viewer stands in as a recorder with buttons for what it reports
vi.mock('@/components/map/lazyMapPanels', () => ({
  PhotoViewer: vi.fn(({ onChanged, onDeleted, onClose }) => (
    <div data-viewer=''>
      <button type='button' onClick={() => onChanged({ id: 'p-1', themes: [] })}>taken out</button>
      <button type='button' onClick={() => onChanged({ id: 'p-1', caption: 'New words', themes: [{ id: 'th-11' }] })}>edited</button>
      <button type='button' onClick={onDeleted}>deleted</button>
      <button type='button' onClick={onClose}>close viewer</button>
    </div>
  )),
}));

const THEME = { id: 'th-11', month: '2026-11', title: 'Worst weather', blurb: 'Rain, fog, the lot.' };
const PHOTOS = [
  { id: 'p-1', caption: 'Rain in Paris' },
  { id: 'p-2', caption: 'Fog in London' },
];

const albumWith = (extra = {}) => {
  const album = { photos: PHOTOS, loading: false, error: null, nextCursor: null, loadMore: vi.fn(), removePhoto: vi.fn(), replacePhoto: vi.fn(), ...extra };
  useThemeAlbum.mockReturnValue(album);
  return album;
};

const open = (props = {}) => {
  const onChanged = vi.fn();
  const onClose = vi.fn();
  render(<ThemeAlbumDialog theme={THEME} mapId='map-1' onChanged={onChanged} onClose={onClose} {...props} />);
  return { onChanged, onClose };
};

describe('ThemeAlbumDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the album’s title, month, blurb and photos', () => {
    albumWith();
    open();
    expect(useThemeAlbum).toHaveBeenCalledWith({ mapId: 'map-1', shareCode: null, themeId: 'th-11' });
    expect(screen.getByText('Worst weather: November 2026')).toBeTruthy();
    expect(screen.getByText('Rain, fog, the lot.')).toBeTruthy();
    expect(screen.getByLabelText('Open Rain in Paris')).toBeTruthy();
    expect(screen.getByLabelText('Open Fog in London')).toBeTruthy();
  });

  it('says when the album is empty, and pages on', () => {
    const album = albumWith({ photos: [], nextCursor: 'c-2' });
    open();
    expect(screen.getByText('No photos in this album.')).toBeTruthy();
    fireEvent.click(screen.getByText('Show more photos'));
    expect(album.loadMore).toHaveBeenCalled();
  });

  it('opens a photo in the viewer with the album as its list', async () => {
    albumWith();
    open({ canEdit: true });
    fireEvent.click(screen.getByLabelText('Open Fog in London'));
    await screen.findByText('close viewer');
    expect(PhotoViewer.mock.lastCall[0]).toMatchObject({ photoId: 'p-2', photo: PHOTOS[1], list: { photos: PHOTOS }, canEdit: true, shareCode: null });
    fireEvent.click(screen.getByText('close viewer'));
    expect(document.querySelector('[data-viewer]')).toBeNull();
  });

  it('takes a photo out of the album when it leaves the theme', async () => {
    const album = albumWith();
    const { onChanged } = open({ canEdit: true });
    fireEvent.click(screen.getByLabelText('Open Rain in Paris'));
    fireEvent.click(await screen.findByText('taken out'));
    expect(album.removePhoto).toHaveBeenCalledWith('p-1');
    expect(onChanged).toHaveBeenCalled();
  });

  it('puts an edited photo back in its place', async () => {
    const album = albumWith();
    open({ canEdit: true });
    fireEvent.click(screen.getByLabelText('Open Rain in Paris'));
    fireEvent.click(await screen.findByText('edited'));
    expect(album.replacePhoto).toHaveBeenCalledWith({ id: 'p-1', caption: 'New words', themes: [{ id: 'th-11' }] });
    expect(album.removePhoto).not.toHaveBeenCalled();
  });

  it('drops a deleted photo and closes the viewer', async () => {
    const album = albumWith();
    const { onChanged } = open({ canEdit: true });
    fireEvent.click(screen.getByLabelText('Open Rain in Paris'));
    fireEvent.click(await screen.findByText('deleted'));
    expect(album.removePhoto).toHaveBeenCalledWith('p-1');
    expect(onChanged).toHaveBeenCalled();
    expect(document.querySelector('[data-viewer]')).toBeNull();
  });

  it('never edits through a share link', async () => {
    albumWith();
    open({ canEdit: true, shareCode: 'CODE', mapId: null });
    fireEvent.click(screen.getByLabelText('Open Rain in Paris'));
    await screen.findByText('close viewer');
    expect(PhotoViewer.mock.lastCall[0]).toMatchObject({ canEdit: false, shareCode: 'CODE' });
  });

  it('opens the viewer as an editor’s for someone unverified, so it can say why it’s locked', async () => {
    albumWith();
    open({ locked: true });
    fireEvent.click(screen.getByLabelText('Open Rain in Paris'));
    await screen.findByText('close viewer');
    expect(PhotoViewer.mock.lastCall[0]).toMatchObject({ canEdit: true, locked: true });
  });

  it('closes', () => {
    albumWith();
    const { onClose } = open();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
