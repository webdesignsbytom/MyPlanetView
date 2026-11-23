import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StampPhotoPicker from '@/components/passport/StampPhotoPicker';
import { clearStampPhoto, getPhotoPage, setStampPhoto } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ clearStampPhoto: vi.fn(), getPhotoPage: vi.fn(), setStampPhoto: vi.fn() }));

const STAMP = { landmarkId: 'eiffel', name: 'Eiffel Tower', photoChosen: false, photo: { id: 'p1' } };

beforeEach(() => {
  vi.clearAllMocks();
  getPhotoPage.mockResolvedValue({
    photos: [
      { id: 'p1', caption: 'At dusk', thumbUrl: '/1.jpg' },
      { id: 'p2', takenAt: '2024-05-01T10:00:00Z', thumbUrl: '/2.jpg' },
      { id: 'v1', kind: 'VIDEO', caption: 'A video' },
    ],
    nextCursor: null,
  });
});

const open = (props = {}) => {
  const handlers = { onSaved: vi.fn().mockResolvedValue(), onClose: vi.fn() };
  const utils = render(<StampPhotoPicker mapId='m1' stamp={STAMP} {...handlers} {...props} />);
  return { ...handlers, unmount: utils.unmount };
};

describe('StampPhotoPicker', () => {
  it('lists the landmark’s photos, never its videos, the one on the stamp pressed', async () => {
    open();
    expect(screen.getByText('Photo for Eiffel Tower')).toBeTruthy();
    expect(screen.getByText('Finding the photos…')).toBeTruthy();
    expect(await screen.findByLabelText('At dusk (on the stamp now)')).toBeTruthy();
    expect(screen.getByLabelText('At dusk (on the stamp now)').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('Photo from 1 May 2024').getAttribute('aria-pressed')).toBe('false');
    expect(screen.queryByLabelText('A video')).toBeNull();
    expect(getPhotoPage).toHaveBeenCalledWith({ mapId: 'm1', landmark: 'eiffel', cursor: undefined, limit: 60 });
    expect(screen.getByText(/It shows the earliest one now\./)).toBeTruthy();
  });

  it('pages through every photo of the landmark', async () => {
    getPhotoPage
      .mockResolvedValueOnce({ photos: [{ id: 'p1', caption: 'One' }], nextCursor: 'c2' })
      .mockResolvedValueOnce({ photos: [{ id: 'p2', caption: 'Two' }], nextCursor: null });
    open();
    expect(await screen.findByLabelText('Two')).toBeTruthy();
    expect(getPhotoPage).toHaveBeenLastCalledWith({ mapId: 'm1', landmark: 'eiffel', cursor: 'c2', limit: 60 });
  });

  it('puts the chosen photo on the stamp, then reloads the passport and closes', async () => {
    setStampPhoto.mockResolvedValue({});
    const { onSaved, onClose } = open();
    fireEvent.click(await screen.findByLabelText('Photo from 1 May 2024'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(setStampPhoto).toHaveBeenCalledWith('m1', 'eiffel', 'p2');
    expect(onSaved).toHaveBeenCalled();
  });

  it('goes back to the first photo once one was chosen', async () => {
    clearStampPhoto.mockResolvedValue({});
    const { onClose } = open({ stamp: { ...STAMP, photoChosen: true } });
    expect(screen.queryByText(/It shows the earliest one now/)).toBeNull();
    fireEvent.click(screen.getByText('Use the first photo'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(clearStampPhoto).toHaveBeenCalledWith('m1', 'eiffel');
  });

  it('just closes when the chosen photo is pressed again', async () => {
    const { onClose } = open({ stamp: { ...STAMP, photoChosen: true } });
    fireEvent.click(await screen.findByLabelText('At dusk (on the stamp now)'));
    expect(onClose).toHaveBeenCalled();
    expect(setStampPhoto).not.toHaveBeenCalled();
  });

  it('says why the photos couldn’t be loaded, or a choice saved', async () => {
    getPhotoPage.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    const { unmount } = open();
    expect(await screen.findByText('Offline.')).toBeTruthy();
    unmount();
    setStampPhoto.mockRejectedValue(new Error('x'));
    const { onClose } = open();
    fireEvent.click(await screen.findByLabelText('Photo from 1 May 2024'));
    expect(await screen.findByText('That change could not be saved.')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
