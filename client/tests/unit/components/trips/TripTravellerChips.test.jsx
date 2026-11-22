import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TripTravellerChips from '@/components/trips/TripTravellerChips';

const TRAVELLERS = [
  { id: 'a', name: 'Charlie' },
  { id: 'b', name: 'Alex' },
  { id: 'c', name: 'Mia' },
];

describe('TripTravellerChips', () => {
  it('draws nothing when the map has no travellers', () => {
    const { container } = render(<TripTravellerChips travellers={[]} selectedIds={[]} onChange={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('has a toggle per traveller, pressed when chosen, under its legend', () => {
    const { container } = render(<TripTravellerChips travellers={TRAVELLERS} selectedIds={['b']} onChange={vi.fn()} />);
    expect(container.querySelector('legend').textContent).toBe('Who’s going');
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(3);
    expect(screen.getByText('Charlie').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Alex').getAttribute('aria-pressed')).toBe('true');
  });

  it('adds a traveller who is not chosen, and takes off one who is', () => {
    const onChange = vi.fn();
    render(<TripTravellerChips travellers={TRAVELLERS} selectedIds={['b']} onChange={onChange} />);
    fireEvent.click(screen.getByText('Mia'));
    expect(onChange).toHaveBeenLastCalledWith(['b', 'c']);
    fireEvent.click(screen.getByText('Alex'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('is read-only without onChange: only the chosen travellers show, as tags', () => {
    const { container } = render(<TripTravellerChips travellers={TRAVELLERS} selectedIds={['a', 'c']} />);
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(screen.getByText('Charlie').tagName).toBe('SPAN');
    expect(screen.getByText('Mia')).toBeTruthy();
    expect(screen.queryByText('Alex')).toBeNull();
  });

  it('disables the toggles while saving, and takes its own legend', () => {
    const { container } = render(
      <TripTravellerChips travellers={TRAVELLERS} selectedIds={[]} onChange={vi.fn()} disabled legend='Who it’s about' />,
    );
    expect(container.querySelector('legend').textContent).toBe('Who it’s about');
    expect([...container.querySelectorAll('button')].every((b) => b.disabled)).toBe(true);
  });
});
