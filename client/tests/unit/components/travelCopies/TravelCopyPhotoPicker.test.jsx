import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TravelCopyPhotoPicker from '@/components/travelCopies/TravelCopyPhotoPicker';
import usePhotoPage from '@/hooks/usePhotoPage';

vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));

const PHOTOS = [
  { id: 'p-1', caption: 'Churros', thumbUrl: 'https://img/p1.jpg' },
  { id: 'p-2', caption: 'Hidden one', hidden: true },
  { id: 'p-3', caption: 'Beach' },
  { id: 'v-1', kind: 'VIDEO', caption: 'Waves' },
];

const page = (extra = {}) => {
  const loadMore = vi.fn();
  usePhotoPage.mockReturnValue({ photos: PHOTOS, loading: false, error: null, nextCursor: null, loadMore, ...extra });
  return loadMore;
};

const pick = (chosenIds = []) => {
  const onChange = vi.fn();
  const view = render(<TravelCopyPhotoPicker mapId='map-f' chosenIds={chosenIds} onChange={onChange} />);
  return { ...view, onChange };
};

describe('TravelCopyPhotoPicker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the map’s photos only once opened', () => {
    page();
    pick();
    expect(usePhotoPage).toHaveBeenLastCalledWith({ mapId: 'map-f', enabled: false });
    const toggle = screen.getByText('Pick photos');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Churros')).toBeNull();
    fireEvent.click(toggle);
    expect(usePhotoPage).toHaveBeenLastCalledWith({ mapId: 'map-f', enabled: true });
    expect(screen.getByText('Done picking photos').getAttribute('aria-expanded')).toBe('true');
  });

  it('never offers hidden photos or videos', () => {
    page();
    pick();
    fireEvent.click(screen.getByText('Pick photos'));
    expect(screen.getByText('Churros')).toBeTruthy();
    expect(screen.getByText('Beach')).toBeTruthy();
    expect(screen.queryByText('Hidden one')).toBeNull();
    expect(screen.queryByText(/Waves/)).toBeNull();
  });

  it('picks and unpicks photos', () => {
    page();
    const { onChange, rerender } = pick();
    fireEvent.click(screen.getByText('Pick photos'));
    fireEvent.click(screen.getByText('Beach').closest('button'));
    expect(onChange).toHaveBeenLastCalledWith(['p-3']);
    rerender(<TravelCopyPhotoPicker mapId='map-f' chosenIds={['p-3']} onChange={onChange} />);
    expect(screen.getByText('1 picked')).toBeTruthy();
    expect(screen.getByText('Beach').closest('button').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByText('Beach').closest('button'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('says what it picks before anything is picked', () => {
    page();
    pick();
    expect(screen.getByText('Any photo on the map, as well as the trips and countries ticked.').getAttribute('aria-live')).toBe('polite');
  });

  it('pages on, says when there are none, and shows the error', () => {
    const loadMore = page({ nextCursor: 'c-2' });
    const first = pick();
    fireEvent.click(screen.getByText('Pick photos'));
    fireEvent.click(screen.getByText('Show more photos'));
    expect(loadMore).toHaveBeenCalled();
    first.unmount();
    page({ photos: [] });
    const second = pick();
    fireEvent.click(screen.getByText('Pick photos'));
    expect(screen.getByText('No photos on this map yet.')).toBeTruthy();
    second.unmount();
    page({ photos: [], error: 'Photos could not be loaded.' });
    pick();
    fireEvent.click(screen.getByText('Pick photos'));
    expect(screen.getByText('Photos could not be loaded.')).toBeTruthy();
  });

  it('shows a spinner while loading', () => {
    page({ photos: [], loading: true });
    pick();
    fireEvent.click(screen.getByText('Pick photos'));
    expect(screen.getByText('Loading photos…')).toBeTruthy();
    expect(screen.queryByText('No photos on this map yet.')).toBeNull();
  });
});
