import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotoGrid from '@/components/photos/PhotoGrid';
import PhotoThumb from '@/components/photos/PhotoThumb';
import PhotoThumbFace from '@/components/photos/PhotoThumbFace';
import SortablePhotoGrid from '@/components/photos/SortablePhotoGrid';

vi.mock('@/components/offers/OfferTile', () => ({
  default: ({ offer, href }) => (
    <a data-offer-tile href={href}>
      {offer.title}
    </a>
  ),
}));

const photosOf = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, caption: `Photo ${i + 1}`, thumbUrl: `/t/${i + 1}.jpg` }));

describe('PhotoThumbFace', () => {
  it('shows the thumbnail, the hidden mark and a waiting landmark suggestion', () => {
    const { container } = render(
      <PhotoThumbFace photo={{ id: 'a', thumbUrl: '/a.jpg', hidden: true, landmarks: [{ id: 'l', confirmed: false }] }} />,
    );
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe('/a.jpg');
    expect(img.getAttribute('draggable')).toBe('false');
    expect(screen.getByTitle('Hidden from viewers')).toBeTruthy();
    expect(screen.getByText('Landmark?')).toBeTruthy();
  });

  it('says nothing about landmarks once every match is confirmed', () => {
    render(<PhotoThumbFace photo={{ id: 'a', thumbUrl: '/a.jpg', landmarks: [{ id: 'l', confirmed: true }] }} />);
    expect(screen.queryByText('Landmark?')).toBeNull();
    expect(screen.queryByTitle('Hidden from viewers')).toBeNull();
  });

  it('says “Preparing…” for a video Cloudflare is still converting, with no play mark', () => {
    const { container } = render(<PhotoThumbFace photo={{ id: 'v', kind: 'VIDEO', videoState: 'PROCESSING', durationS: 90 }} />);
    expect(screen.getByText('Preparing…')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByText('1:30')).toBeNull();
  });

  it('says a failed video couldn’t be prepared', () => {
    render(<PhotoThumbFace photo={{ id: 'v', kind: 'VIDEO', videoState: 'FAILED' }} />);
    expect(screen.getByText('Couldn’t prepare')).toBeTruthy();
  });

  it('gives a ready video a play mark and its length', () => {
    render(<PhotoThumbFace photo={{ id: 'v', kind: 'VIDEO', videoState: 'READY', thumbUrl: '/v.jpg', durationS: 90 }} />);
    expect(screen.getByText('1:30').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('PhotoThumb', () => {
  it('is a button named after the photo that opens it', () => {
    const onOpen = vi.fn();
    const photo = { id: 'a', caption: 'Eiffel Tower', thumbUrl: '/a.jpg' };
    render(<PhotoThumb photo={photo} onOpen={onOpen} />);
    fireEvent.click(screen.getByLabelText('Open Eiffel Tower'));
    expect(onOpen).toHaveBeenCalledWith(photo);
  });

  it('names a video by its length and state', () => {
    render(<PhotoThumb photo={{ id: 'v', kind: 'VIDEO', durationS: 42, videoState: 'PROCESSING' }} onOpen={() => {}} />);
    expect(screen.getByLabelText('Open Video, 42 seconds, being prepared')).toBeTruthy();
  });
});

describe('PhotoGrid', () => {
  it('lists the photos and opens one', () => {
    const onOpen = vi.fn();
    const photos = photosOf(2);
    render(<PhotoGrid photos={photos} onOpen={onOpen} />);
    fireEvent.click(screen.getByLabelText('Open Photo 2'));
    expect(onOpen).toHaveBeenCalledWith(photos[1]);
  });

  it('shows its empty text, and none while loading or failed', () => {
    const { rerender } = render(<PhotoGrid photos={[]} emptyText='Nothing here.' />);
    expect(screen.getByText('Nothing here.')).toBeTruthy();
    rerender(<PhotoGrid photos={[]} loading emptyText='Nothing here.' />);
    expect(screen.queryByText('Nothing here.')).toBeNull();
    expect(screen.getByText('Loading photos…')).toBeTruthy();
    rerender(<PhotoGrid photos={[]} error='No photos for you.' emptyText='Nothing here.' />);
    expect(screen.queryByText('Nothing here.')).toBeNull();
    expect(screen.getByText('No photos for you.').getAttribute('role')).toBe('alert');
  });

  it('offers “Show more photos” while there are more', () => {
    const onLoadMore = vi.fn();
    render(<PhotoGrid photos={photosOf(1)} hasMore onLoadMore={onLoadMore} />);
    fireEvent.click(screen.getByText('Show more photos'));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('puts a caption under each photo', () => {
    render(<PhotoGrid photos={photosOf(2)} caption={(p) => `In ${p.id}`} />);
    expect(screen.getByText('In p1')).toBeTruthy();
    expect(screen.getByText('In p2')).toBeTruthy();
  });

  it('puts an offer card after every `every` photos, with the photos around the slot', () => {
    const cardAt = vi.fn((slot) => ({ offer: { title: `Offer ${slot}` }, href: `/go/${slot}` }));
    const { container } = render(<PhotoGrid photos={photosOf(7)} offerSlots={{ every: 3, cardAt }} />);
    const slots = container.querySelectorAll('[data-offer-slot]');
    expect([...slots].map((s) => s.getAttribute('data-offer-slot'))).toEqual(['0', '1']);
    // The card comes straight after the third photo, in reading order
    const items = [...container.querySelectorAll('ul > li')];
    expect(items[3].getAttribute('data-offer-slot')).toBe('0');
    expect(items[7].getAttribute('data-offer-slot')).toBe('1');
    // Slot 0's photos: the third, the fourth, the second, the fifth, the first, the sixth
    expect(cardAt.mock.calls[0][1].map((p) => p.id)).toEqual(['p3', 'p4', 'p2', 'p5', 'p1', 'p6']);
  });

  it('leaves a slot empty when there is no card for it', () => {
    const { container } = render(<PhotoGrid photos={photosOf(3)} offerSlots={{ every: 3, cardAt: () => null }} />);
    expect(container.querySelector('[data-offer-slot]')).toBeNull();
  });

  it('only offers rearranging to editors with two photos or more', () => {
    const { rerender } = render(<PhotoGrid photos={photosOf(2)} />);
    expect(screen.queryByText('Rearrange photos')).toBeNull();
    rerender(<PhotoGrid photos={photosOf(1)} onMove={vi.fn()} />);
    expect(screen.queryByText('Rearrange photos')).toBeNull();
    rerender(<PhotoGrid photos={photosOf(2)} onMove={vi.fn()} />);
    expect(screen.getByText('Rearrange photos')).toBeTruthy();
  });

  it('swaps in the sortable grid while rearranging, never with offer cards', { timeout: 20000 }, async () => {
    const cardAt = () => ({ offer: { title: 'Hotel' }, href: '/go/1' });
    const { container } = render(<PhotoGrid photos={photosOf(3)} onMove={vi.fn()} offerSlots={{ every: 3, cardAt }} />);
    expect(container.querySelector('[data-offer-slot]')).toBeTruthy();
    fireEvent.click(screen.getByText('Rearrange photos'));
    expect(screen.getByText(/Drag a photo to its new place/)).toBeTruthy();
    expect(screen.getByText('Done rearranging')).toBeTruthy();
    expect(container.querySelector('[data-offer-slot]')).toBeNull();
    await waitFor(() => expect(container.querySelector('[aria-roledescription="movable photo"]')).toBeTruthy(), { timeout: 10000 });
    fireEvent.click(screen.getByText('Done rearranging'));
    expect(screen.getByText('Rearrange photos')).toBeTruthy();
  });
});

describe('SortablePhotoGrid', () => {
  it('draws each photo as a movable tile named after it, with spoken instructions', () => {
    const { container } = render(<SortablePhotoGrid photos={photosOf(3)} onMove={vi.fn()} columnsClass='grid-cols-3' />);
    const tiles = container.querySelectorAll('[aria-roledescription="movable photo"]');
    expect(tiles.length).toBe(3);
    expect(tiles[0].getAttribute('aria-label')).toBe('Photo 1');
    expect(container.querySelector('ul').className).toContain('grid-cols-3');
    expect(screen.getByText(/Press Space or Enter to pick up this photo/)).toBeTruthy();
  });
});
