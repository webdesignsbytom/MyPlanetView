import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotoLandmarkList from '@/components/photos/PhotoLandmarkList';
import { LandmarkMarksContext } from '@/hooks/useLandmarkMarks';
import { addPhotoLandmark, confirmPhotoLandmark, removePhotoLandmark } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ addPhotoLandmark: vi.fn(), confirmPhotoLandmark: vi.fn(), removePhotoLandmark: vi.fn() }));
vi.mock('@/hooks/useLandmarks', () => ({
  default: () => ({
    landmarks: [
      { id: 'lm-eiffel', name: 'Eiffel Tower' },
      { id: 'lm-louvre', name: 'Louvre' },
    ],
    loading: false,
    error: null,
  }),
}));

const PHOTO = { id: 'p1', countryCode: 'FR', thumbUrl: 'https://x/p1.webp', landmarks: [{ id: 'lm-eiffel', name: 'Eiffel Tower', confirmed: false, distanceM: 120 }] };

// On the map page the list hears of each new stamp (useLandmarkMarks' onPhotoStamped), for
// its celebration (24 Nov 2026); elsewhere (the trip page) there's no one to tell
const open = ({ photo = PHOTO, withMarks = true } = {}) => {
  const onChanged = vi.fn();
  const onPhotoStamped = vi.fn();
  const list = <PhotoLandmarkList photo={photo} canEdit onChanged={onChanged} />;
  render(
    withMarks ? (
      <LandmarkMarksContext.Provider value={{ stamped: new Set(), ticked: new Set(), onToggle: null, onPhotoStamped }}>{list}</LandmarkMarksContext.Provider>
    ) : (
      list
    ),
  );
  return { onChanged, onPhotoStamped };
};

describe('PhotoLandmarkList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists a suggestion with how far away it is', () => {
    open();
    expect(screen.getByText('Eiffel Tower — suggested (120 m away)')).toBeTruthy();
  });

  it('tells the map page of the stamp a confirmed suggestion makes', async () => {
    const updated = { ...PHOTO, landmarks: [{ id: 'lm-eiffel', name: 'Eiffel Tower', confirmed: true }] };
    confirmPhotoLandmark.mockResolvedValue({ photo: updated });
    const { onChanged, onPhotoStamped } = open();
    fireEvent.click(screen.getByRole('button', { name: "That's right: Eiffel Tower" }));
    await waitFor(() => expect(onPhotoStamped).toHaveBeenCalledWith('lm-eiffel', updated));
    expect(confirmPhotoLandmark).toHaveBeenCalledWith('p1', 'lm-eiffel');
    expect(onChanged).toHaveBeenCalledWith(updated);
  });

  it('and of one added by hand', async () => {
    const updated = { ...PHOTO, landmarks: [...PHOTO.landmarks, { id: 'lm-louvre', name: 'Louvre', confirmed: true }] };
    addPhotoLandmark.mockResolvedValue({ photo: updated });
    const { onPhotoStamped } = open();
    fireEvent.change(screen.getByLabelText('Add a landmark'), { target: { value: 'lm-louvre' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(onPhotoStamped).toHaveBeenCalledWith('lm-louvre', updated));
  });

  it('tells it nothing for a removal, or a save that failed', async () => {
    removePhotoLandmark.mockResolvedValue({ photo: { ...PHOTO, landmarks: [] } });
    const { onChanged, onPhotoStamped } = open();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Eiffel Tower' }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    confirmPhotoLandmark.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    fireEvent.click(screen.getByRole('button', { name: "That's right: Eiffel Tower" }));
    await waitFor(() => expect(screen.getByText('Offline.')).toBeTruthy());
    expect(onPhotoStamped).not.toHaveBeenCalled();
  });

  it('confirms with no one to tell off the map page', async () => {
    confirmPhotoLandmark.mockResolvedValue({ photo: { ...PHOTO, landmarks: [{ id: 'lm-eiffel', name: 'Eiffel Tower', confirmed: true }] } });
    const { onChanged } = open({ withMarks: false });
    fireEvent.click(screen.getByRole('button', { name: "That's right: Eiffel Tower" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});
