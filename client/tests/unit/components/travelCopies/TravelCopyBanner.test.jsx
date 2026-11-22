import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TravelCopyBanner from '@/components/travelCopies/TravelCopyBanner';
import TravelCopyReviewDialog from '@/components/travelCopies/TravelCopyReviewDialog';
import { getMapTravelCopies } from '@/api/travelCopiesApi';

vi.mock('@/api/travelCopiesApi', () => ({ getMapTravelCopies: vi.fn() }));
vi.mock('@/components/travelCopies/TravelCopyReviewDialog', () => ({
  default: vi.fn(({ requestId, onChanged, onClose }) => (
    <div data-review={requestId}>
      <button type='button' onClick={() => onChanged({ id: requestId, status: 'APPROVED' })}>approve it</button>
      <button type='button' onClick={() => onChanged({ id: requestId, status: 'PENDING' })}>still waiting</button>
      <button type='button' onClick={onClose}>close review</button>
    </div>
  )),
}));

const request = (id, extra = {}) => ({
  id,
  status: 'PENDING',
  canDecide: true,
  requestedBy: { name: 'Charlie' },
  traveller: { name: 'Charlie R' },
  ...extra,
});

describe('TravelCopyBanner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows nothing when no request waits for this person', async () => {
    getMapTravelCopies.mockResolvedValue({
      incoming: [request('r-1', { status: 'APPROVED' }), request('r-2', { canDecide: false })],
    });
    const { container } = render(<TravelCopyBanner mapId='map-1' />);
    await waitFor(() => expect(getMapTravelCopies).toHaveBeenCalledWith('map-1'));
    expect(container.innerHTML).toBe('');
  });

  it('shows nothing when the requests couldn’t be loaded', async () => {
    getMapTravelCopies.mockRejectedValue(new Error('offline'));
    const { container } = render(<TravelCopyBanner mapId='map-1' />);
    await waitFor(() => expect(getMapTravelCopies).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
  });

  it('names the first request waiting, and how many more', async () => {
    getMapTravelCopies.mockResolvedValue({ incoming: [request('r-1'), request('r-2', { requestedBy: { name: '' } }), request('r-3')] });
    render(<TravelCopyBanner mapId='map-1' />);
    const tag = await screen.findByLabelText('A request to copy travels');
    expect(tag.tagName).toBe('SECTION');
    expect(tag.textContent).toContain('Charlie asks for copies of their travels as Charlie R.');
    expect(tag.textContent).toContain('And 2 more requests, in Settings, “This map”.');
  });

  it('says “Someone” for a name it doesn’t have, and one more request in the singular', async () => {
    getMapTravelCopies.mockResolvedValue({ incoming: [request('r-1', { requestedBy: { name: null } }), request('r-2')] });
    render(<TravelCopyBanner mapId='map-1' />);
    const tag = await screen.findByLabelText('A request to copy travels');
    expect(tag.textContent).toContain('Someone asks');
    expect(tag.textContent).toContain('And 1 more request,');
  });

  it('opens the request to review, and takes it off the tag once answered', async () => {
    getMapTravelCopies.mockResolvedValue({ incoming: [request('r-1'), request('r-2', { requestedBy: { name: 'Alex' } })] });
    render(<TravelCopyBanner mapId='map-1' />);
    fireEvent.click(await screen.findByText('Review it'));
    expect(await screen.findByText('approve it')).toBeTruthy();
    expect(TravelCopyReviewDialog.mock.lastCall[0].requestId).toBe('r-1');
    // Still pending: stays
    fireEvent.click(screen.getByText('still waiting'));
    expect(screen.getByLabelText('A request to copy travels').textContent).toContain('Charlie asks');
    fireEvent.click(screen.getByText('approve it'));
    fireEvent.click(screen.getByText('close review'));
    expect(screen.getByLabelText('A request to copy travels').textContent).toContain('Alex asks');
    expect(document.querySelector('[data-review]')).toBeNull();
  });
});
