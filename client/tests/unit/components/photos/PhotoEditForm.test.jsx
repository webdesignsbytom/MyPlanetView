import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotoEditForm from '@/components/photos/PhotoEditForm';
import PhotoLandmarkList from '@/components/photos/PhotoLandmarkList';
import { addPhotoLandmark, confirmPhotoLandmark, removePhotoLandmark, updatePhoto } from '@/api/travelApi';
import useLandmarks from '@/hooks/useLandmarks';

vi.mock('@/api/travelApi', () => ({
  updatePhoto: vi.fn(),
  addPhotoLandmark: vi.fn(),
  confirmPhotoLandmark: vi.fn(),
  removePhotoLandmark: vi.fn(),
}));
vi.mock('@/hooks/useLandmarks', () => ({ default: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  useLandmarks.mockReturnValue({ landmarks: [] });
});

const PHOTO = { id: 'p1', caption: 'Old caption', countryCode: 'FR', tripId: 't1', takenAt: '2024-05-01T10:00:00Z', hidden: false };
const TRIPS = [
  { id: 't1', title: 'Paris' },
  { id: 't2', title: 'Rome' },
];

describe('PhotoEditForm', () => {
  it('starts from the photo as it is', () => {
    render(<PhotoEditForm photo={PHOTO} trips={TRIPS} onSaved={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText('Caption').value).toBe('Old caption');
    expect(screen.getByLabelText('Country').value).toBe('FR');
    expect(screen.getByLabelText('Taken on').value).toBe('2024-05-01');
    expect(screen.getByLabelText('Trip').value).toBe('t1');
    expect(screen.getByLabelText('Hide from viewers (only you and the editors see it)').checked).toBe(false);
  });

  it('saves the changes, an empty caption as none and the day at noon', async () => {
    const saved = { ...PHOTO, caption: null };
    updatePhoto.mockResolvedValue({ photo: saved });
    const onSaved = vi.fn();
    render(<PhotoEditForm photo={PHOTO} trips={TRIPS} onSaved={onSaved} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText('Caption'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Trip'), { target: { value: 't2' } });
    fireEvent.change(screen.getByLabelText('Taken on'), { target: { value: '2024-06-02' } });
    fireEvent.click(screen.getByLabelText('Hide from viewers (only you and the editors see it)'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(updatePhoto).toHaveBeenCalledWith('p1', {
      caption: null,
      countryCode: 'FR',
      takenAt: '2024-06-02T12:00:00.000Z',
      hidden: true,
      tripId: 't2',
    });
  });

  it('leaves the trip alone where moving between trips isn’t possible', async () => {
    updatePhoto.mockResolvedValue({ photo: PHOTO });
    render(<PhotoEditForm photo={PHOTO} onSaved={() => {}} onCancel={() => {}} />);
    expect(screen.queryByLabelText('Trip')).toBeNull();
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(updatePhoto).toHaveBeenCalled());
    expect('tripId' in updatePhoto.mock.calls[0][1]).toBe(false);
  });

  it('says why a save failed', async () => {
    updatePhoto.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many photos of France.' }));
    render(<PhotoEditForm photo={PHOTO} onSaved={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Too many photos of France.')).toBeTruthy();
  });

  it('cancels', () => {
    const onCancel = vi.fn();
    render(<PhotoEditForm photo={PHOTO} onSaved={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('PhotoLandmarkList', () => {
  const MATCHED = {
    id: 'p1',
    countryCode: 'FR',
    landmarks: [
      { id: 'eiffel', name: 'Eiffel Tower', confirmed: false, distanceM: 120 },
      { id: 'louvre', name: 'Louvre', confirmed: true },
      { id: 'versailles', name: 'Versailles', confirmed: false, distanceM: 2400 },
    ],
  };

  it('shows nothing to a viewer when there are no matches', () => {
    const { container } = render(<PhotoLandmarkList photo={{ id: 'p1', landmarks: [] }} canEdit={false} onChanged={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('lists the matches, suggestions with their distance', () => {
    render(<PhotoLandmarkList photo={MATCHED} canEdit={false} onChanged={() => {}} />);
    expect(screen.getByText('Eiffel Tower — suggested (120 m away)')).toBeTruthy();
    expect(screen.getByText('Versailles — suggested (2.4 km away)')).toBeTruthy();
    expect(screen.getByText('Louvre')).toBeTruthy();
    expect(screen.queryByText('Remove')).toBeNull();
    expect(useLandmarks).toHaveBeenCalledWith('FR', { enabled: false });
  });

  it('lets an editor confirm a suggestion and remove a match', async () => {
    const updated = { ...MATCHED, landmarks: [] };
    confirmPhotoLandmark.mockResolvedValue({ photo: updated });
    removePhotoLandmark.mockResolvedValue({ photo: updated });
    const onChanged = vi.fn();
    render(<PhotoLandmarkList photo={MATCHED} canEdit onChanged={onChanged} />);
    expect(screen.queryByLabelText('That\'s right: Louvre')).toBeNull();
    fireEvent.click(screen.getByLabelText('That\'s right: Eiffel Tower'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(updated));
    expect(confirmPhotoLandmark).toHaveBeenCalledWith('p1', 'eiffel');
    fireEvent.click(screen.getByLabelText('Remove Louvre'));
    await waitFor(() => expect(removePhotoLandmark).toHaveBeenCalledWith('p1', 'louvre'));
  });

  it('lets an editor add one of the country’s other landmarks', async () => {
    useLandmarks.mockReturnValue({ landmarks: [{ id: 'louvre', name: 'Louvre' }, { id: 'arc', name: 'Arc de Triomphe' }] });
    addPhotoLandmark.mockResolvedValue({ photo: MATCHED });
    render(<PhotoLandmarkList photo={MATCHED} canEdit onChanged={() => {}} />);
    const select = screen.getByLabelText('Add a landmark');
    // Only the ones not matched already
    expect([...select.querySelectorAll('option')].map((o) => o.textContent)).toContain('Arc de Triomphe');
    expect([...select.querySelectorAll('option')].map((o) => o.textContent)).not.toContain('Louvre');
    expect(screen.getByText('Add').closest('button').disabled).toBe(true);
    fireEvent.change(select, { target: { value: 'arc' } });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(addPhotoLandmark).toHaveBeenCalledWith('p1', 'arc'));
  });

  it('says why a change failed', async () => {
    removePhotoLandmark.mockRejectedValue(new Error('x'));
    render(<PhotoLandmarkList photo={MATCHED} canEdit onChanged={() => {}} />);
    fireEvent.click(screen.getByLabelText('Remove Louvre'));
    expect(await screen.findByText('That change could not be saved.')).toBeTruthy();
  });

  it('says so when an editor’s photo has no matches yet', () => {
    render(<PhotoLandmarkList photo={{ id: 'p1', countryCode: 'FR' }} canEdit onChanged={() => {}} />);
    expect(screen.getByText('No landmarks matched yet.')).toBeTruthy();
  });
});
