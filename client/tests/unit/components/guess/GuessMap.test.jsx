import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GuessMap from '@/components/guess/GuessMap';

vi.mock('@/components/map/WorldMap', () => ({
  default: ({ visitsByCode, selectedCode, onSelectCountry, showUnvisited, label }) => (
    <div data-world={label} data-visits={JSON.stringify(visitsByCode)} data-selected={selectedCode ?? ''} data-unvisited={String(showUnvisited)}>
      {onSelectCountry ? (
        <button type='button' onClick={() => onSelectCountry('JP')}>
          Japan
        </button>
      ) : null}
    </div>
  ),
}));
vi.mock('@/components/map/MapBackground', () => ({ default: () => null }));

const world = () => document.querySelector('[data-world]');

describe('GuessMap', () => {
  it('fades the land, colours the place chosen, and passes a press on', () => {
    const onChoose = vi.fn();
    const { rerender } = render(<GuessMap chosenCode={null} onChoose={onChoose} label='Guess' />);
    expect(world().getAttribute('data-unvisited')).toBe('false');
    expect(JSON.parse(world().getAttribute('data-visits'))).toEqual({});
    fireEvent.click(screen.getByText('Japan'));
    expect(onChoose).toHaveBeenCalledWith('JP');
    rerender(<GuessMap chosenCode='JP' onChoose={onChoose} label='Guess' />);
    expect(JSON.parse(world().getAttribute('data-visits'))).toEqual({ JP: 'VISITED' });
    expect(world().getAttribute('data-selected')).toBe('JP');
  });

  it('once answered, colours only the answer and takes no more presses', () => {
    render(<GuessMap chosenCode='JP' answerCode='KR' onChoose={vi.fn()} label='Answer' />);
    expect(JSON.parse(world().getAttribute('data-visits'))).toEqual({ KR: 'VISITED' });
    expect(screen.queryByText('Japan')).toBeNull();
    expect(screen.getByRole('group', { name: 'Zoom' })).toBeTruthy();
  });
});
