// The map's photos chosen for a moment, a pin's visit or a One Shot's tick
import React, { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MomentPhotoPicker from '@/components/moments/MomentPhotoPicker';
import usePhotoPage from '@/hooks/usePhotoPage';

vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));

const PHOTOS = [
  { id: 'p1', kind: 'PHOTO', caption: 'First', thumbUrl: '/p1.webp' },
  { id: 'v1', kind: 'VIDEO', caption: 'A clip', thumbUrl: '/v1.webp', durationS: 12, videoState: 'READY' },
  { id: 'p2', kind: 'PHOTO', caption: 'Second', thumbUrl: '/p2.webp' },
  { id: 'p3', kind: 'PHOTO', caption: 'Third', thumbUrl: '/p3.webp' },
];

// The picker as a form holds it: `chosen` kept in state, every change seen by `onChange`
function Held({ start = [], onChange = () => {}, ...props }) {
  const [chosen, setChosen] = useState(start);
  return (
    <MomentPhotoPicker
      idPrefix='pick'
      source={{ mapId: 'm1' }}
      chosen={chosen}
      onChange={(next) => {
        setChosen(next);
        onChange(next);
      }}
      {...props}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  usePhotoPage.mockReturnValue({ photos: PHOTOS, loading: false, error: null, nextCursor: null, loadMore: vi.fn() });
});

describe('MomentPhotoPicker', () => {
  it('offers the map’s photos and videos, up to its most', () => {
    const onChange = vi.fn();
    render(<Held onChange={onChange} max={2} fullText='Two at most.' />);
    expect(screen.getByRole('group', { name: 'Photos' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Choose photos' }));
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    fireEvent.click(screen.getByRole('button', { name: /A clip/ }));
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'p1' }), expect.objectContaining({ id: 'v1' })]);
    expect(screen.getByText('2 of 2 chosen')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Second' }).disabled).toBe(true);
    expect(screen.getByText('Two at most.')).toBeTruthy();
  });

  // Life's One Shots (26 Nov 2026): photos of you with it, the first on its card
  it('can leave videos out, name the set, and put any chosen photo first, on the card', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Held
        onChange={onChange}
        start={[
          { id: 'p1', thumbUrl: '/p1.webp' },
          { id: 'p2', thumbUrl: '/p2.webp' },
          { id: 'p3', thumbUrl: '/p3.webp' },
        ]}
        photosOnly
        coverLabel='On the card'
        legend='Photos of you with it'
      />,
    );
    expect(screen.getByRole('group', { name: 'Photos of you with it' })).toBeTruthy();
    const strip = screen.getByRole('list', { name: 'Chosen photos' });
    expect(strip.querySelector('[data-cover-photo]').textContent).toBe('On the card');
    expect(strip.querySelector('[data-cover-photo] img').getAttribute('src')).toBe('/p1.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Put photo 3 on the card' }));
    expect(onChange).toHaveBeenLastCalledWith([{ id: 'p3', thumbUrl: '/p3.webp' }, { id: 'p1', thumbUrl: '/p1.webp' }, { id: 'p2', thumbUrl: '/p2.webp' }]);
    expect(container.querySelector('[data-cover-photo] img').getAttribute('src')).toBe('/p3.webp');

    fireEvent.click(screen.getByRole('button', { name: 'Choose photos' }));
    expect(screen.queryByRole('button', { name: /A clip/ })).toBeNull();
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(3);
  });
});
