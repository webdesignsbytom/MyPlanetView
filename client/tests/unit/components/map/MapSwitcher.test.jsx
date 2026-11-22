import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import MapSwitcher from '@/components/map/MapSwitcher';
import MapSwitcherItem from '@/components/map/MapSwitcherItem';
import NewMapForm from '@/components/map/NewMapForm';
import { createMap } from '@/api/travelApi';
import { forgetMapLists, myMaps, sharedTrips } from '@/utils/map/mapListCache';
import { withProviders } from './helpers';

vi.mock('@/api/travelApi', () => ({ createMap: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({
  forgetMapLists: vi.fn(),
  myMaps: { peek: vi.fn(), load: vi.fn() },
  sharedTrips: { peek: vi.fn(), load: vi.fn() },
}));
vi.mock('@/components/trips/TripCard', () => ({ default: ({ trip, subtitle }) => <li data-trip-card={trip.id}>{`${trip.title} (${subtitle})`}</li> }));
vi.mock('@/components/plans/ExtraMapDialog', () => ({
  default: ({ reason, pendingMap, onPaid, onClose }) => (
    <div data-extra-map={reason} data-pending={pendingMap.name}>
      <button type='button' onClick={onPaid}>
        Paid
      </button>
      <button type='button' onClick={onClose}>
        Not now
      </button>
    </div>
  ),
}));

const MAPS = [
  { id: 'm1', name: 'My map', role: 'OWNER', counts: { countries: 1, photos: 3 } },
  { id: 'm2', name: 'The Morgans', role: 'VIEWER', ownerName: 'Alex', counts: { countries: 4, photos: 1 } },
];

function Where() {
  return <p data-where={useLocation().pathname} />;
}

const open = (props = {}) => {
  const onClose = vi.fn();
  const result = render(
    withProviders(
      <>
        <MapSwitcher currentMapId='m1' userId='u1' userName='Charlie' onClose={onClose} {...props} />
        <Where />
      </>,
      { route: '/maps/m1' },
    ),
  );
  return { ...result, onClose, where: () => result.container.querySelector('[data-where]').getAttribute('data-where') };
};

beforeEach(() => {
  vi.clearAllMocks();
  myMaps.peek.mockReturnValue(null);
  sharedTrips.peek.mockReturnValue(null);
  myMaps.load.mockResolvedValue(MAPS);
  sharedTrips.load.mockResolvedValue([{ id: 't1', title: 'Stag do', mapName: 'Tom’s map' }]);
});

describe('MapSwitcherItem', () => {
  it('links to the map, saying whose it is and what is on it', () => {
    const onPick = vi.fn();
    const { container } = render(withProviders(<ul><MapSwitcherItem map={MAPS[1]} current={false} onPick={onPick} /></ul>));
    const link = container.querySelector('a');
    expect(link.getAttribute('href')).toBe('/maps/m2');
    expect(link.hasAttribute('aria-current')).toBe(false);
    expect(link.textContent).toContain('Viewer, Alex’s map · 4 countries · 1 photo');
    fireEvent.click(link);
    expect(onPick).toHaveBeenCalled();
  });

  it('marks the open map, and says nothing of whose for your own', () => {
    const { container } = render(withProviders(<ul><MapSwitcherItem map={MAPS[0]} current onPick={() => {}} /></ul>));
    expect(container.querySelector('a').getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('a').textContent).toContain('1 country · 3 photos');
    expect(container.querySelector('a').textContent).not.toContain('Owner');
  });
});

describe('NewMapForm', () => {
  it('needs a name', () => {
    const onCreate = vi.fn();
    render(<NewMapForm firstTraveller='Charlie' onCreate={onCreate} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('Create map'));
    expect(screen.getByRole('alert').textContent).toBe('Give the map a name.');
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('makes a couple’s map with you as its first traveller', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    render(<NewMapForm firstTraveller='Charlie' onCreate={onCreate} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Map name/), { target: { value: '  Our trips ' } });
    fireEvent.click(screen.getByText('Create map'));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ name: 'Our trips', groupType: 'COUPLE', travellers: [{ name: 'Charlie' }] }));
  });

  it('calls you "Me" without a name, and says why a map wasn’t made', async () => {
    const onCreate = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many maps today.' }));
    const onCancel = vi.fn();
    render(<NewMapForm onCreate={onCreate} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/Map name/), { target: { value: 'Solo' } });
    fireEvent.click(screen.getByText('Create map'));
    expect((await screen.findByRole('alert')).textContent).toBe('Too many maps today.');
    expect(onCreate.mock.calls[0][0].travellers).toEqual([{ name: 'Me' }]);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('MapSwitcher', () => {
  it('loads your maps, then the ones shared with you and the group trips', async () => {
    const { container } = open();
    expect(screen.getByText('Loading your maps…')).toBeTruthy();
    expect(await screen.findByText('Shared with you')).toBeTruthy();
    expect(container.querySelector('a[aria-current="page"]').getAttribute('href')).toBe('/maps/m1');
    expect(screen.getByText('Group trips')).toBeTruthy();
    expect(container.querySelector('[data-trip-card="t1"]').textContent).toBe('Stag do (Tom’s map)');
    expect(myMaps.load).toHaveBeenCalledWith('u1');
  });

  it('shows the lists from earlier at once', () => {
    myMaps.peek.mockReturnValue(MAPS);
    myMaps.load.mockReturnValue(new Promise(() => {}));
    open();
    expect(screen.queryByText('Loading your maps…')).toBeNull();
    expect(screen.getByText('The Morgans')).toBeTruthy();
  });

  it('says when the maps can’t be loaded', async () => {
    myMaps.load.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    open();
    expect((await screen.findByRole('alert')).textContent).toBe('Offline.');
  });

  it('makes a new map, then opens it', async () => {
    createMap.mockResolvedValue({ map: { id: 'm9' } });
    const { onClose, where } = open();
    fireEvent.click(await screen.findByText('New map'));
    fireEvent.change(screen.getByLabelText(/Map name/), { target: { value: 'Japan 2027' } });
    fireEvent.click(screen.getByText('Create map'));
    await waitFor(() => expect(where()).toBe('/maps/m9'));
    expect(forgetMapLists).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('offers to pay for an extra map when every slot is used, then makes it', async () => {
    createMap.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 402 } })).mockResolvedValue({ map: { id: 'm8' } });
    const { container, where } = open();
    fireEvent.click(await screen.findByText('New map'));
    fireEvent.change(screen.getByLabelText(/Map name/), { target: { value: 'Extra' } });
    fireEvent.click(screen.getByText('Create map'));
    const dialog = await waitFor(() => {
      const found = container.querySelector('[data-extra-map]');
      expect(found).not.toBeNull();
      return found;
    });
    expect(dialog.getAttribute('data-extra-map')).toBe('new');
    expect(dialog.getAttribute('data-pending')).toBe('Extra');
    fireEvent.click(screen.getByText('Paid'));
    await waitFor(() => expect(where()).toBe('/maps/m8'));
  });

  it('tells an unverified user why they can’t make a map', async () => {
    open({ locked: true });
    expect(await screen.findByText(/to make another map/)).toBeTruthy();
    expect(screen.queryByText('New map')).toBeNull();
  });
});
