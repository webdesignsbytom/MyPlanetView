import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TravelCopyDialog from '@/components/travelCopies/TravelCopyDialog';
import TravelCopyReviewDialog from '@/components/travelCopies/TravelCopyReviewDialog';
import { getMyMaps } from '@/api/travelApi';
import {
  approveTravelCopy,
  continueTravelCopy,
  declineTravelCopy,
  getCopyChoices,
  getTravelCopy,
  previewTravelCopy,
  requestTravelCopy,
} from '@/api/travelCopiesApi';

vi.mock('@/api/travelApi', () => ({ getMyMaps: vi.fn() }));
vi.mock('@/api/travelCopiesApi', () => ({
  approveTravelCopy: vi.fn(),
  continueTravelCopy: vi.fn(),
  declineTravelCopy: vi.fn(),
  getCopyChoices: vi.fn(),
  getTravelCopy: vi.fn(),
  previewTravelCopy: vi.fn(),
  requestTravelCopy: vi.fn(),
}));
vi.mock('@/components/travelCopies/TravelCopyPhotoPicker', () => ({
  default: ({ mapId, onChange }) => (
    <button type='button' data-photo-picker={mapId} onClick={() => onChange(['ph1'])}>
      Pick one photo
    </button>
  ),
}));

const TO_MAP = { id: 'mine', name: 'Charlie’s map' };
const MAPS = [
  { id: 'mine', name: 'Charlie’s map', role: 'OWNER' },
  { id: 'morgans', name: 'The Morgans', role: 'VIEWER', ownerName: 'Alex Morgan' },
];
const CHOICES = {
  travellerId: 'charlie',
  travellers: [
    { id: 'charlie', name: 'Charlie' },
    { id: 'alex', name: 'Alex', taken: true },
  ],
  trips: [{ id: 'spain', title: 'Spain at Easter', startDate: '2010-04-01', endDate: '2010-04-08', countries: ['ES'], photos: 2 }],
  moments: [{ id: 'churros', title: 'First churros', countryCode: 'ES', photoIds: ['a'] }],
  countries: [{ countryCode: 'IE', photos: 1 }],
};
const PREVIEW = { photos: 3, trips: 1, moments: 0, fits: 3, alreadyCopied: 0, locked: false, countries: [{ countryCode: 'ES', photos: 3, fits: 3 }] };

beforeEach(() => {
  vi.clearAllMocks();
  getMyMaps.mockResolvedValue({ maps: MAPS });
  getCopyChoices.mockResolvedValue(CHOICES);
  previewTravelCopy.mockResolvedValue(PREVIEW);
});

const open = async (props = {}) => {
  const handlers = { onClose: vi.fn(), onRequested: vi.fn() };
  render(<TravelCopyDialog toMap={TO_MAP} {...handlers} {...props} />);
  const select = await screen.findByLabelText('Copy from');
  return { ...handlers, select };
};
const chooseMap = async (select) => {
  fireEvent.change(select, { target: { value: 'morgans' } });
  await screen.findByText('Which one are you?');
};

describe('TravelCopyDialog', () => {
  it('offers every other map they’re on, naming another owner’s', async () => {
    const { select } = await open();
    expect([...select.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Choose a map', 'The Morgans (Alex Morgan)']);
  });

  it('says when they’re on no other map', async () => {
    getMyMaps.mockResolvedValue({ maps: [MAPS[0]] });
    render(<TravelCopyDialog toMap={TO_MAP} onClose={() => {}} />);
    expect(await screen.findByText(/You’re not on any other map yet/)).toBeTruthy();
  });

  it('asks which traveller they are, a linked one not to be had', async () => {
    const { select } = await open();
    await chooseMap(select);
    expect(getCopyChoices).toHaveBeenCalledWith('morgans', null);
    expect(screen.getByLabelText('Charlie').checked).toBe(true);
    const alex = screen.getByLabelText('Alex (someone else’s account)');
    expect(alex.disabled).toBe(true);
  });

  it('lists the trips, moments and countries they can take', async () => {
    const { select } = await open();
    await chooseMap(select);
    expect(screen.getByText('Spain at Easter')).toBeTruthy();
    expect(screen.getByText('1 Apr 2010 to 8 Apr 2010 · Spain · 2 photos')).toBeTruthy();
    expect(screen.getByText('Spain · 1 photo')).toBeTruthy();
    expect(screen.getByLabelText('Ireland (1)')).toBeTruthy();
    expect(screen.getByText('Tick something to bring.')).toBeTruthy();
    expect(screen.getByText('Ask for a copy').closest('button').disabled).toBe(true);
  });

  it('works out what fits, then asks the map’s owner', async () => {
    const request = { id: 'r1', status: 'PENDING' };
    requestTravelCopy.mockResolvedValue({ request });
    const { select, onRequested } = await open();
    await chooseMap(select);
    fireEvent.click(screen.getByText('Spain at Easter'));
    fireEvent.click(screen.getByText('Pick one photo'));
    expect(await screen.findByText('Comes to 3 photos and 1 trip.')).toBeTruthy();
    expect(previewTravelCopy).toHaveBeenLastCalledWith('morgans', {
      toMapId: 'mine',
      travellerId: 'charlie',
      tripIds: ['spain'],
      momentIds: [],
      countryCodes: [],
      photoIds: ['ph1'],
    });
    fireEvent.click(screen.getByText('Ask for a copy'));
    expect(await screen.findByText(/Asked\. Alex Morgan has been emailed/)).toBeTruthy();
    expect(onRequested).toHaveBeenCalledWith(request);
  });

  it('says what won’t fit, what’s there already, and a locked map', async () => {
    previewTravelCopy.mockResolvedValue({ ...PREVIEW, alreadyCopied: 1, locked: true, countries: [{ countryCode: 'IE', photos: 5, fits: 2 }] });
    const { select } = await open();
    await chooseMap(select);
    fireEvent.click(screen.getByLabelText('Ireland (1)'));
    expect(await screen.findByText(/already on your map, and won’t be copied again/)).toBeTruthy();
    expect(screen.getByText(/Ireland: 2 of 5 photos fit within your plan’s photos per country/)).toBeTruthy();
    expect(screen.getByText('“Charlie’s map” isn’t paid for, so it can’t take new photos.')).toBeTruthy();
    expect(screen.getByText('Ask for a copy').closest('button').disabled).toBe(true);
  });

  it('says “1 of these photos is already on your map”', async () => {
    previewTravelCopy.mockResolvedValue({ ...PREVIEW, alreadyCopied: 1 });
    const { select } = await open();
    await chooseMap(select);
    fireEvent.click(screen.getByLabelText('Ireland (1)'));
    expect(await screen.findByText(/^1 of these photos is already on your map/)).toBeTruthy();
  });

  it('asks again for another traveller’s travels', async () => {
    const withMia = { ...CHOICES, travellers: [...CHOICES.travellers, { id: 'mia', name: 'Mia' }] };
    getCopyChoices.mockResolvedValue(withMia);
    const { select } = await open();
    await chooseMap(select);
    getCopyChoices.mockResolvedValue({ ...withMia, travellerId: 'mia', trips: [] });
    fireEvent.click(screen.getByLabelText('Mia'));
    await waitFor(() => expect(getCopyChoices).toHaveBeenLastCalledWith('morgans', 'mia'));
    expect(await screen.findByText('No trips list you as a traveller.')).toBeTruthy();
    expect(screen.getByLabelText('Mia').checked).toBe(true);
  });

  it('says why a request wasn’t sent', async () => {
    requestTravelCopy.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Already asked.' }));
    const { select } = await open();
    await chooseMap(select);
    fireEvent.click(screen.getByText('Spain at Easter'));
    await screen.findByText('Comes to 3 photos and 1 trip.');
    fireEvent.click(screen.getByText('Ask for a copy'));
    expect(await screen.findByText('Already asked.')).toBeTruthy();
  });

  it('says why the travels couldn’t be loaded', async () => {
    getCopyChoices.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Not on that map.' }));
    const { select } = await open();
    fireEvent.change(select, { target: { value: 'morgans' } });
    expect(await screen.findByText('Not on that map.')).toBeTruthy();
  });
});

describe('TravelCopyReviewDialog', () => {
  const REQUEST = {
    id: 'r1',
    status: 'PENDING',
    canDecide: true,
    requestedBy: { name: 'Charlie' },
    traveller: { name: 'Charlie' },
    fromMap: { name: 'The Morgans' },
    toMap: { name: 'Charlie’s map' },
    photos: 3,
    trips: 1,
    moments: 1,
    progress: { done: 0, copied: 0, skipped: 0 },
    tripList: [{ id: 'spain', title: 'Spain at Easter', startDate: '2010-04-01' }],
    momentList: [{ id: 'churros', title: 'First churros' }],
    countries: [
      { countryCode: 'ES', photos: 2 },
      { countryCode: null, photos: 1 },
    ],
  };

  it('says who asks for what, as which traveller, for which map', async () => {
    getTravelCopy.mockResolvedValue({ request: REQUEST });
    render(<TravelCopyReviewDialog requestId='r1' onClose={() => {}} />);
    expect(screen.getByText('Loading the request…')).toBeTruthy();
    expect(await screen.findByText(/for their own map “Charlie’s map”: 3 photos, 1 trip and 1 moment\./)).toBeTruthy();
    expect(screen.getByText('Spain at Easter, 1 Apr 2010')).toBeTruthy();
    expect(screen.getByText('First churros')).toBeTruthy();
    expect(screen.getByText('Spain: 2')).toBeTruthy();
    expect(screen.getByText('Photos with no country: 1')).toBeTruthy();
  });

  it('approves, then carries the copy on until it’s done', async () => {
    getTravelCopy.mockResolvedValue({ request: REQUEST });
    approveTravelCopy.mockResolvedValue({ request: { ...REQUEST, status: 'APPROVED', progress: { done: 1, copied: 1, skipped: 0 } } });
    continueTravelCopy.mockResolvedValue({ request: { ...REQUEST, status: 'DONE', progress: { done: 3, copied: 3, skipped: 0 } } });
    const onChanged = vi.fn();
    render(<TravelCopyReviewDialog requestId='r1' onClose={() => {}} onChanged={onChanged} />);
    fireEvent.click(await screen.findByText('Approve and copy'));
    expect(await screen.findByText('Copied 3 photos')).toBeTruthy();
    expect(approveTravelCopy).toHaveBeenCalledWith('r1');
    expect(continueTravelCopy).toHaveBeenCalledWith('r1');
    expect(onChanged).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'DONE' }));
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('declines', async () => {
    getTravelCopy.mockResolvedValue({ request: REQUEST });
    declineTravelCopy.mockResolvedValue({ request: { ...REQUEST, status: 'DECLINED' } });
    render(<TravelCopyReviewDialog requestId='r1' onClose={() => {}} />);
    fireEvent.click(await screen.findByText('Decline'));
    expect((await screen.findByText('Declined')).getAttribute('role')).toBe('status');
    expect(continueTravelCopy).not.toHaveBeenCalled();
  });

  it('says why a decision failed', async () => {
    getTravelCopy.mockResolvedValue({ request: REQUEST });
    approveTravelCopy.mockRejectedValue(new Error('x'));
    render(<TravelCopyReviewDialog requestId='r1' onClose={() => {}} />);
    fireEvent.click(await screen.findByText('Approve and copy'));
    expect(await screen.findByText('That didn’t work. Please try again.')).toBeTruthy();
  });

  it('only shows where it stands to someone who can’t decide', async () => {
    getTravelCopy.mockResolvedValue({ request: { ...REQUEST, canDecide: false } });
    const onClose = vi.fn();
    render(<TravelCopyReviewDialog requestId='r1' onClose={onClose} />);
    fireEvent.click(await screen.findByText('Close'));
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByText('Approve and copy')).toBeNull();
  });

  it('says why the request couldn’t be loaded', async () => {
    getTravelCopy.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Gone.' }));
    render(<TravelCopyReviewDialog requestId='r1' onClose={() => {}} />);
    expect(await screen.findByText('Gone.')).toBeTruthy();
  });
});
