import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ThemeSection from '@/components/themes/ThemeSection';
import useMapThemes from '@/hooks/useMapThemes';
import ThemeAlbumDialog from '@/components/themes/ThemeAlbumDialog';
import ThemePhotoPicker from '@/components/themes/ThemePhotoPicker';

vi.mock('@/hooks/useMapThemes', () => ({ default: vi.fn() }));
// The dialogs have their own tests: here they record what they're given and can be closed
vi.mock('@/components/themes/ThemeAlbumDialog', () => ({
  default: vi.fn(({ theme, onClose, onChanged }) => (
    <div data-album={theme.id}>
      <button type='button' onClick={onChanged}>album changed</button>
      <button type='button' onClick={onClose}>close album</button>
    </div>
  )),
}));
vi.mock('@/components/themes/ThemePhotoPicker', () => ({
  default: vi.fn(({ onClose, onEntered }) => (
    <div data-picker=''>
      <button type='button' onClick={onEntered}>entered</button>
      <button type='button' onClick={onClose}>close picker</button>
    </div>
  )),
}));

const CURRENT = {
  id: 'th-11',
  month: '2026-11',
  endsAt: '2026-12-01T00:00:00.000Z',
  title: 'Worst weather',
  blurb: 'Rain, fog, the lot.',
  count: 2,
  entriesLeft: 18,
  running: true,
};
const PAST = { id: 'th-10', month: '2026-10', title: 'Doors', count: 1, running: false };

const withThemes = (themes, extra = {}) => {
  const reload = vi.fn();
  useMapThemes.mockReturnValue({ themes, loading: false, error: null, reload, ...extra });
  return reload;
};

const show = (props = {}) => {
  const onChanged = vi.fn();
  render(<ThemeSection mapId='map-1' onChanged={onChanged} {...props} />);
  return { onChanged };
};

describe('ThemeSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks for the map’s themes, or the share link’s', () => {
    withThemes(null, { loading: true });
    show({ shareCode: 'CODE', mapId: null });
    expect(useMapThemes).toHaveBeenCalledWith({ mapId: null, shareCode: 'CODE' });
    expect(screen.getByText('Loading the theme…')).toBeTruthy();
  });

  it('shows the error', () => {
    withThemes(null, { error: 'The monthly theme could not be loaded.' });
    show();
    expect(screen.getByRole('alert').textContent).toBe('The monthly theme could not be loaded.');
  });

  it('says when there’s no theme this month', () => {
    withThemes({ current: null, albums: [] });
    show();
    expect(screen.getByText('There’s no theme this month.')).toBeTruthy();
  });

  it('shows this month’s theme as a card with its count', () => {
    withThemes({ current: CURRENT, albums: [CURRENT] });
    show();
    expect(screen.getByText('November 2026, until 30 November')).toBeTruthy();
    expect(screen.getByText('Worst weather')).toBeTruthy();
    expect(screen.getByText('Rain, fog, the lot.')).toBeTruthy();
    expect(screen.getByText('2 photos from this map (18 more can go in)')).toBeTruthy();
    // A running theme isn't a past one
    expect(screen.queryByText('Past themes')).toBeNull();
  });

  it('lets an editor choose photos, then reloads and tells the panel', () => {
    const reload = withThemes({ current: CURRENT, albums: [] });
    const { onChanged } = show({ canEdit: true });
    fireEvent.click(screen.getByText('Choose photos'));
    const picker = document.body.querySelector('[data-picker]');
    expect(picker).toBeTruthy();
    expect(ThemePhotoPicker.mock.lastCall[0]).toMatchObject({ theme: CURRENT, mapId: 'map-1' });
    fireEvent.click(screen.getByText('entered'));
    expect(reload).toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalled();
    fireEvent.click(screen.getByText('close picker'));
    expect(document.body.querySelector('[data-picker]')).toBeNull();
  });

  it('gives viewers no “Choose photos”', () => {
    withThemes({ current: { ...CURRENT, count: 0 }, albums: [] });
    show();
    expect(screen.queryByText('Choose photos')).toBeNull();
    expect(screen.queryByText('Open the album')).toBeNull();
    expect(screen.getByText('No photos from this map in it yet.')).toBeTruthy();
    expect(screen.getByText('No photos from this map')).toBeTruthy();
  });

  it('says when the map has entered as many as it can', () => {
    withThemes({ current: { ...CURRENT, count: 20, entriesLeft: 0 }, albums: [] });
    show({ canEdit: true });
    expect(screen.queryByText('Choose photos')).toBeNull();
    expect(screen.getByText('That’s the most one map can enter. Take a photo out to choose another.')).toBeTruthy();
  });

  it('tells someone unverified why they can’t enter photos', () => {
    withThemes({ current: CURRENT, albums: [] });
    show({ locked: true });
    expect(screen.getByText(/Verify your email address to enter photos in the theme\./)).toBeTruthy();
  });

  it('opens this month’s album and the past ones over the page', () => {
    withThemes({ current: CURRENT, albums: [CURRENT, PAST] });
    show({ canEdit: true, locked: false });
    fireEvent.click(screen.getByText('Open the album'));
    expect(document.body.querySelector('[data-album="th-11"]')).toBeTruthy();
    fireEvent.click(screen.getByText('close album'));
    fireEvent.click(screen.getByText('October 2026: Doors (1 photo)'));
    expect(document.body.querySelector('[data-album="th-10"]')).toBeTruthy();
    expect(ThemeAlbumDialog.mock.lastCall[0]).toMatchObject({ theme: PAST, mapId: 'map-1', canEdit: true, locked: false });
  });
});
