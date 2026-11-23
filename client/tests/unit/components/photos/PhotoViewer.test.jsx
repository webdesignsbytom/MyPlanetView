import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotoViewer from '@/components/photos/PhotoViewer';
import { deletePhoto, getPhoto } from '@/api/travelApi';
import usePhotoPage from '@/hooks/usePhotoPage';

vi.mock('@/api/travelApi', () => ({ deletePhoto: vi.fn(), getPhoto: vi.fn() }));
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
vi.mock('@/components/photos/PhotoEditForm', () => ({
  default: ({ onSaved, onCancel }) => (
    <div data-edit-form>
      <button type='button' onClick={() => onSaved({ id: 'p2', caption: 'Renamed' })}>
        Save edit
      </button>
      <button type='button' onClick={onCancel}>
        Cancel edit
      </button>
    </div>
  ),
}));
vi.mock('@/components/photos/PhotoLandmarkList', () => ({
  default: ({ canEdit }) => <div data-landmark-list={canEdit ? 'edit' : 'view'} />,
}));
vi.mock('@/components/themes/PhotoThemeLine', () => ({ default: ({ canEdit }) => <div data-theme-line={canEdit ? 'edit' : 'view'} /> }));
vi.mock('@/components/photos/VideoPlayer', () => ({
  default: ({ photo, onRefresh }) => (
    <div data-video-player={photo.videoState}>
      <button type='button' onClick={onRefresh}>
        Check now
      </button>
    </div>
  ),
}));
vi.mock('@/components/photos/PhotoAlbumViewer', () => ({
  default: ({ index, photos, onClose }) => (
    <div data-album-viewer={index} data-count={photos.length}>
      <button type='button' onClick={onClose}>
        Close album
      </button>
    </div>
  ),
}));

const twelve = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i + 1}`,
  caption: `Photo ${i + 1}`,
  displayUrl: `/d/${i + 1}.jpg`,
  thumbUrl: `/t/${i + 1}.jpg`,
}));

const pageOf = (photos, extra = {}) => ({ photos, nextCursor: null, loadMore: vi.fn(), ...extra });

// jsdom has no PointerEvent, so fireEvent would send a plain Event without the position
class FakePointerEvent extends MouseEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? '';
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('PointerEvent', FakePointerEvent);
  usePhotoPage.mockReturnValue(pageOf([]));
  getPhoto.mockImplementation((id) => Promise.resolve({ photo: { id, countryCode: 'FR', takenAt: '2024-05-01T10:00:00Z' } }));
});

const open = (props = {}) => {
  const onClose = vi.fn();
  render(<PhotoViewer photoId='p2' photo={twelve[1]} list={{ photos: twelve }} onClose={onClose} {...props} />);
  return { onClose };
};

describe('PhotoViewer', () => {
  it('opens at once with the photo it was given, over its thumbnail', () => {
    getPhoto.mockReturnValue(new Promise(() => {}));
    open();
    const img = screen.getByAltText('Photo 2');
    expect(img.getAttribute('src')).toBe('/d/2.jpg');
    expect(img.getAttribute('style')).toContain('/t/2.jpg');
    expect(screen.queryByText('Opening photo…')).toBeNull();
  });

  it('shows a spinner when opened by id alone, until the photo arrives', async () => {
    let resolve;
    getPhoto.mockReturnValue(new Promise((r) => (resolve = r)));
    open({ photo: null, list: null });
    expect(screen.getByText('Opening photo…')).toBeTruthy();
    await act(async () => resolve({ photo: { id: 'p2', caption: 'From the stamp', displayUrl: '/d.jpg' } }));
    expect(screen.getByAltText('From the stamp')).toBeTruthy();
  });

  it('says why a photo opened by id couldn’t be opened', async () => {
    getPhoto.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Gone.' }));
    open({ photo: null, list: null });
    expect(await screen.findByText('Gone.')).toBeTruthy();
  });

  it('adds the details from the photo’s own reply', async () => {
    open();
    expect(await screen.findByText('France')).toBeTruthy();
    expect(screen.getByText('1 May 2024')).toBeTruthy();
    expect(getPhoto).toHaveBeenCalledWith('p2', { shareCode: undefined });
  });

  it('steps through the gallery with Previous and Next, saying “2 of 12”', () => {
    open();
    expect(screen.getByText('2 of 12')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Next photo'));
    expect(screen.getByText('3 of 12')).toBeTruthy();
    expect(screen.getByAltText('Photo 3')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Previous photo'));
    fireEvent.click(screen.getByLabelText('Previous photo'));
    expect(screen.getByText('1 of 12')).toBeTruthy();
    expect(screen.getByLabelText('Previous photo').disabled).toBe(true);
  });

  it('switches Next off at the end of the gallery', () => {
    open({ photoId: 'p12', photo: twelve[11] });
    expect(screen.getByText('12 of 12')).toBeTruthy();
    expect(screen.getByLabelText('Next photo').disabled).toBe(true);
  });

  it('steps with the arrow keys, but not from inside a field', () => {
    open();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('3 of 12')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('2 of 12')).toBeTruthy();
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(screen.getByText('2 of 12')).toBeTruthy();
    input.remove();
  });

  it('steps with a swipe across the photo, which isn’t also a tap', () => {
    open();
    const photo = screen.getByLabelText('Show Photo 2 full screen');
    fireEvent.pointerDown(photo, { pointerType: 'touch', clientX: 300, clientY: 100 });
    fireEvent.pointerUp(photo, { pointerType: 'touch', clientX: 100, clientY: 110 });
    fireEvent.click(photo);
    expect(screen.getByText('3 of 12')).toBeTruthy();
    expect(document.querySelector('[data-album-viewer]')).toBeNull();
  });

  it('shows the photo full screen on a tap, over the same list', () => {
    open();
    fireEvent.click(screen.getByLabelText('Show Photo 2 full screen'));
    const album = document.querySelector('[data-album-viewer]');
    expect(album.getAttribute('data-album-viewer')).toBe('1');
    expect(album.getAttribute('data-count')).toBe('12');
    fireEvent.click(screen.getByText('Close album'));
    expect(document.querySelector('[data-album-viewer]')).toBeNull();
  });

  it('pages a gallery list on near its end, and counts it as “or more”', () => {
    const loadMore = vi.fn();
    usePhotoPage.mockReturnValue(pageOf(twelve.slice(0, 4), { nextCursor: 'c2', loadMore }));
    render(<PhotoViewer photoId='p2' photo={twelve[1]} list={{ filters: { mapId: 'm1' } }} onClose={() => {}} />);
    expect(usePhotoPage).toHaveBeenCalledWith({ mapId: 'm1', enabled: true, refresh: false });
    expect(screen.getByText('2 of 4+')).toBeTruthy();
    expect(loadMore).toHaveBeenCalled();
  });

  it('gives a viewer no editing', async () => {
    open();
    await screen.findByText('France');
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
    expect(document.querySelector('[data-landmark-list]').getAttribute('data-landmark-list')).toBe('view');
  });

  it('lets an editor edit, keeping the saved change', async () => {
    const onChanged = vi.fn();
    open({ canEdit: true, onChanged });
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save edit'));
    expect(onChanged).toHaveBeenCalledWith({ id: 'p2', caption: 'Renamed' });
    expect(document.querySelector('[data-edit-form]')).toBeNull();
    expect(screen.getByAltText('Renamed')).toBeTruthy();
  });

  it('deletes only after asking, then closes', async () => {
    deletePhoto.mockResolvedValue({});
    const onDeleted = vi.fn();
    const { onClose } = open({ canEdit: true, onDeleted });
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Keep it'));
    expect(deletePhoto).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Yes, delete'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(deletePhoto).toHaveBeenCalledWith('p2');
    expect(onDeleted).toHaveBeenCalledWith('p2');
  });

  it('says why a delete failed, and stays open', async () => {
    deletePhoto.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Not now.' }));
    const { onClose } = open({ canEdit: true });
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('Yes, delete'));
    expect(await screen.findByText('Not now.')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks an unverified editor out of changes, saying why, but keeps the download', async () => {
    getPhoto.mockResolvedValue({ photo: { id: 'p2', originalUrl: '/o.jpg', bestCopy: 'PRINT' } });
    open({ canEdit: true, locked: true });
    expect(await screen.findByText('Download print copy')).toBeTruthy();
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
    expect(screen.getByText(/change or delete photos/)).toBeTruthy();
    expect(document.querySelector('[data-landmark-list]').getAttribute('data-landmark-list')).toBe('view');
  });

  it('offers the original to download', async () => {
    getPhoto.mockResolvedValue({ photo: { id: 'p2', originalUrl: '/o.jpg', bestCopy: 'ORIGINAL' } });
    open({ canEdit: true });
    expect((await screen.findByText('Download original')).getAttribute('href')).toBe('/o.jpg');
  });

  it('shows a theme line only once the photo’s own reply is in, and never lets a share link enter it', async () => {
    open({ canEdit: true, shareCode: 'ABCD' });
    expect(document.querySelector('[data-theme-line]')).toBeNull();
    await screen.findByText('France');
    expect(document.querySelector('[data-theme-line]').getAttribute('data-theme-line')).toBe('view');
  });

  describe('a video still being prepared', () => {
    afterEach(() => vi.useRealTimers());

    it('plays in the video player, with no landmarks, and checks again every few seconds', async () => {
      vi.useFakeTimers();
      const video = { id: 'v1', kind: 'VIDEO', videoState: 'PROCESSING', durationS: 30 };
      getPhoto.mockResolvedValue({ photo: video });
      const onChanged = vi.fn();
      render(<PhotoViewer photoId='v1' photo={video} list={{ photos: [video] }} canEdit onChanged={onChanged} onClose={() => {}} />);
      await act(async () => {});
      expect(document.querySelector('[data-video-player]').getAttribute('data-video-player')).toBe('PROCESSING');
      expect(document.querySelector('[data-landmark-list]')).toBeNull();
      expect(screen.getByText('0:30')).toBeTruthy();
      getPhoto.mockResolvedValue({ photo: { ...video, videoState: 'READY' } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000);
      });
      expect(onChanged).toHaveBeenCalledWith({ ...video, videoState: 'READY' });
      expect(document.querySelector('[data-video-player]').getAttribute('data-video-player')).toBe('READY');
    });
  });
});
