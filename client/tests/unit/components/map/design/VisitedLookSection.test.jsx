// How the map shows the places been to, in Settings (src/components/map/design/VisitedLookSection.jsx;
// 25 Nov 2026, the user's wish: the map's own, in every map style)
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import VisitedLookSection from '@/components/map/design/VisitedLookSection';
import useVisitedLookEditor from '@/hooks/useVisitedLookEditor';

vi.mock('@/hooks/useVisitedLookEditor', () => ({ default: vi.fn() }));

const MAP = { id: 'map-1', name: 'Our trips', visitedLook: 'BADGE', visitedColour: null, visitedFinish: null };
const editor = (look = {}, error = '') => ({
  look: { visitedLook: 'BADGE', visitedColour: null, visitedFinish: null, ...look },
  error,
  change: vi.fn(),
});
const open = (props = {}) => render(<VisitedLookSection map={MAP} styleId='starry' onSave={vi.fn()} {...props} />);

describe('VisitedLookSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is the map’s, for every style, edited through its own editor', () => {
    const onSave = vi.fn();
    const preview = { get: () => null, set: vi.fn(), subscribe: () => () => {} };
    useVisitedLookEditor.mockReturnValue(editor());
    const { container } = open({ onSave, preview });
    expect(useVisitedLookEditor).toHaveBeenCalledWith({ map: MAP, onSave, preview });
    expect(container.querySelector('[data-visited-look-editor] h3').textContent).toBe('Places you’ve been');
    expect(screen.getByText(/In every map style\. Everyone who opens “Our trips” sees them this way/)).toBeTruthy();
  });

  it('chooses a badge, a colour or both, and the colour once there’s one to show', () => {
    const e = editor();
    useVisitedLookEditor.mockReturnValue(e);
    const { rerender } = open();
    expect(screen.getByLabelText('A badge').checked).toBe(true);
    expect(screen.queryByLabelText('Visited country colour')).toBeNull();
    fireEvent.click(screen.getByLabelText('A colour'));
    expect(e.change).toHaveBeenLastCalledWith({ visitedLook: 'COLOUR' });

    const coloured = editor({ visitedLook: 'BOTH', visitedColour: '#7c3aed' });
    useVisitedLookEditor.mockReturnValue(coloured);
    rerender(<VisitedLookSection map={MAP} styleId='starry' onSave={vi.fn()} />);
    expect(screen.getByLabelText('A colour and a badge').checked).toBe(true);
    const colour = screen.getByLabelText('Visited country colour');
    expect(colour.value).toBe('#7c3aed');
    // Choosing a colour leaves a metallic finish
    fireEvent.input(colour, { target: { value: '#aa00aa' } });
    expect(coloured.change).toHaveBeenLastCalledWith({ visitedColour: '#aa00aa', visitedFinish: null });
    fireEvent.click(screen.getByLabelText('Visited country colour: back to the usual colour'));
    expect(coloured.change).toHaveBeenLastCalledWith({ visitedColour: null, visitedFinish: null });
  });

  it('offers gold, silver and bronze beside the colour, the chosen one pressed', () => {
    const e = editor({ visitedLook: 'COLOUR', visitedFinish: 'SILVER' });
    useVisitedLookEditor.mockReturnValue(e);
    open();
    expect(screen.getByText('Silver').closest('button').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByText('Gold').closest('button'));
    expect(e.change).toHaveBeenLastCalledWith({ visitedFinish: 'GOLD' });
    fireEvent.click(screen.getByText('Silver').closest('button'));
    expect(e.change).toHaveBeenLastCalledWith({ visitedFinish: null });
  });

  it('says only when it couldn’t be saved, never “Saved.”', () => {
    useVisitedLookEditor.mockReturnValue(editor({}, 'That couldn’t be saved. Please try again.'));
    open();
    expect(screen.getByRole('alert').textContent).toBe('That couldn’t be saved. Please try again.');
    expect(screen.queryByText('Saved.')).toBeNull();
  });
});
