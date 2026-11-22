import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TravelCopySection from '@/components/travelCopies/TravelCopySection';
import TravelCopyDialog from '@/components/travelCopies/TravelCopyDialog';
import TravelCopyReviewDialog from '@/components/travelCopies/TravelCopyReviewDialog';
import useMapTravelCopies from '@/hooks/useMapTravelCopies';
import { withdrawTravelCopy } from '@/api/travelCopiesApi';

vi.mock('@/api/travelCopiesApi', () => ({ withdrawTravelCopy: vi.fn() }));
vi.mock('@/hooks/useMapTravelCopies', () => ({ default: vi.fn() }));
vi.mock('@/components/travelCopies/TravelCopyDialog', () => ({
  default: vi.fn(({ onRequested, onClose }) => (
    <div data-copy-dialog=''>
      <button type='button' onClick={() => onRequested({ id: 'r-new' })}>asked</button>
      <button type='button' onClick={onClose}>close dialog</button>
    </div>
  )),
}));
vi.mock('@/components/travelCopies/TravelCopyReviewDialog', () => ({
  default: vi.fn(({ onClose }) => (
    <div data-review-dialog=''>
      <button type='button' onClick={onClose}>close review</button>
    </div>
  )),
}));

const MAP = { id: 'map-1', name: 'Charlie’s map' };
const OUT = { id: 'r-1', status: 'PENDING', mine: true, canCancel: true, fromMap: { name: 'The Morgans' }, photos: 12, trips: 1, moments: 0, progress: { done: 0 } };
const OUT_DONE = { id: 'r-2', status: 'DONE', mine: true, canCancel: false, fromMap: { name: 'Gran’s map' }, photos: 3, progress: { copied: 3, skipped: 0 } };
const IN = { id: 'r-3', status: 'PENDING', canDecide: true, requestedBy: { name: 'Alex' }, traveller: { name: 'Alex M' }, photos: 2, progress: { done: 0 } };

const withCopies = (extra = {}) => {
  const copies = { incoming: [], outgoing: [], error: null, reload: vi.fn().mockResolvedValue(), put: vi.fn(), ...extra };
  useMapTravelCopies.mockReturnValue(copies);
  return copies;
};

describe('TravelCopySection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('explains bringing travels onto this map', () => {
    withCopies();
    render(<TravelCopySection map={MAP} />);
    expect(useMapTravelCopies).toHaveBeenCalledWith('map-1');
    expect(screen.getByText('Bring your travels').tagName).toBe('H3');
    expect(screen.getByText(/ask its owner for copies of your own on “Charlie’s map”/)).toBeTruthy();
    expect(screen.queryByLabelText('Your requests')).toBeNull();
  });

  it('opens the dialog to choose travels and reloads once asked', async () => {
    const copies = withCopies();
    render(<TravelCopySection map={MAP} />);
    fireEvent.click(screen.getByText('Choose travels to bring'));
    fireEvent.click(await screen.findByText('asked'));
    expect(copies.reload).toHaveBeenCalled();
    expect(TravelCopyDialog.mock.lastCall[0].toMap).toBe(MAP);
    fireEvent.click(screen.getByText('close dialog'));
    expect(document.querySelector('[data-copy-dialog]')).toBeNull();
  });

  it('lists their requests and how each stands, a waiting one withdrawable', async () => {
    withdrawTravelCopy.mockResolvedValue({});
    const copies = withCopies({ outgoing: [OUT, OUT_DONE] });
    render(<TravelCopySection map={MAP} />);
    const list = screen.getByLabelText('Your requests');
    expect(list.textContent).toContain('From “The Morgans”: 12 photos and 1 trip');
    expect(list.textContent).toContain('Waiting for an answer');
    expect(list.textContent).toContain('From “Gran’s map”: 3 photos');
    expect(list.textContent).toContain('Copied 3 photos');
    expect(screen.getAllByText('Withdraw').length).toBe(1);
    fireEvent.click(screen.getByText('Withdraw'));
    await waitFor(() => expect(copies.reload).toHaveBeenCalled());
    expect(withdrawTravelCopy).toHaveBeenCalledWith('r-1');
  });

  it('says why a withdrawal failed', async () => {
    withdrawTravelCopy.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Already approved.' }));
    withCopies({ outgoing: [OUT] });
    render(<TravelCopySection map={MAP} />);
    fireEvent.click(screen.getByText('Withdraw'));
    expect((await screen.findByRole('alert')).textContent).toBe('Already approved.');
  });

  it('lists the requests to copy from this map, each opening the review', async () => {
    const copies = withCopies({ incoming: [IN, { ...IN, id: 'r-4', canDecide: false, status: 'DECLINED', requestedBy: { name: null } }] });
    render(<TravelCopySection map={MAP} />);
    const list = screen.getByLabelText('Requests to copy from this map');
    expect(list.textContent).toContain('Alex, as Alex M: 2 photos');
    expect(list.textContent).toContain('Waiting for you to approve or decline');
    expect(list.textContent).toContain('Someone, as Alex M');
    expect(list.textContent).toContain('Declined');
    expect(screen.getAllByText('Review').length).toBe(1);
    fireEvent.click(screen.getByText('Review'));
    await screen.findByText('close review');
    expect(TravelCopyReviewDialog.mock.lastCall[0]).toMatchObject({ requestId: 'r-3', onChanged: copies.put });
    fireEvent.click(screen.getByText('close review'));
    expect(document.querySelector('[data-review-dialog]')).toBeNull();
  });

  it('shows the list’s own error', () => {
    withCopies({ error: 'The requests couldn’t be loaded.' });
    render(<TravelCopySection map={MAP} />);
    expect(screen.getByRole('alert').textContent).toBe('The requests couldn’t be loaded.');
  });
});
