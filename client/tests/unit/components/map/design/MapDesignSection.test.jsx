import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MapDesignSection from '@/components/map/design/MapDesignSection';
import useMapDesignEditor from '@/hooks/useMapDesignEditor';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';

vi.mock('@/hooks/useMapDesignEditor', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));

const DESIGN = { shown: true, countries: { FR: '#ff0000' }, names: '#101010', grid: null, hover: '#00ff00', picture: null };
const MAP = { id: 'map-1', name: 'Our trips', designs: { starry: DESIGN } };

const editor = (overrides = {}) => ({
  design: DESIGN,
  status: { state: 'idle', error: '' },
  picture: { busy: false, progress: 0 },
  change: vi.fn(),
  setCountryColour: vi.fn(),
  choosePicture: vi.fn(),
  removePicture: vi.fn(),
  ...overrides,
});

const open = (props = {}) => render(<MapDesignSection map={MAP} styleId='starry' onDesignChange={() => {}} {...props} />);

describe('MapDesignSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMustVerifyEmail.mockReturnValue(false);
  });

  it('edits the design of the map’s style, and says so', () => {
    const preview = { get: () => null, subscribe: () => () => {} };
    const onDesignChange = vi.fn();
    useMapDesignEditor.mockReturnValue(editor());
    const { container } = open({ preview, onDesignChange });
    expect(useMapDesignEditor).toHaveBeenCalledWith({ mapId: 'map-1', style: 'starry', design: DESIGN, onDesignChange, preview });
    expect(container.querySelector('[data-map-design-editor]')).not.toBeNull();
    expect(screen.getByText(/for the Starry night style: each style keeps its own/)).toBeTruthy();
    expect(screen.getByText(/Everyone who opens “Our trips” sees it this way/)).toBeTruthy();
  });

  it('gives another style its own design, or none', () => {
    useMapDesignEditor.mockReturnValue(editor({ design: null }));
    open({ styleId: 'mono' });
    expect(useMapDesignEditor.mock.calls[0][0]).toMatchObject({ style: 'mono', design: null });
    expect(screen.queryByLabelText('Show this map in its own design')).toBeNull();
  });

  it('switches the design on and off', () => {
    const e = editor({ design: { ...DESIGN, shown: false } });
    useMapDesignEditor.mockReturnValue(e);
    open();
    const box = screen.getByLabelText('Show this map in its own design');
    expect(box.checked).toBe(false);
    fireEvent.click(box);
    expect(e.change).toHaveBeenCalledWith({ shown: true });
  });

  it('changes the names’, grid’s and hovered country’s colours', () => {
    const e = editor();
    useMapDesignEditor.mockReturnValue(e);
    open();
    expect(screen.getByLabelText('Country names').value).toBe('#101010');
    expect(screen.getByLabelText('Country highlight when hovered').value).toBe('#00ff00');
    fireEvent.input(screen.getByLabelText('Grid lines'), { target: { value: '#222222' } });
    fireEvent.input(screen.getByLabelText('Country highlight when hovered'), { target: { value: '#333333' } });
    fireEvent.click(screen.getByLabelText('Country names: back to the usual colour'));
    expect(e.change.mock.calls).toEqual([[{ grid: '#222222' }], [{ hover: '#333333' }], [{ names: null }]]);
  });

  // How the places been to show (25 Nov 2026, the user's wish): a badge, a colour, or both
  it('chooses how the places been to show, and their colour once there’s one to show', () => {
    const e = editor();
    useMapDesignEditor.mockReturnValue(e);
    const { rerender } = open();
    expect(screen.getByLabelText('A badge').checked).toBe(true);
    expect(screen.queryByLabelText('Visited country colour')).toBeNull();
    fireEvent.click(screen.getByLabelText('A colour'));
    expect(e.change).toHaveBeenLastCalledWith({ visitedLook: 'COLOUR' });

    const coloured = editor({ design: { ...DESIGN, visitedLook: 'BOTH', visited: '#7c3aed' } });
    useMapDesignEditor.mockReturnValue(coloured);
    rerender(<MapDesignSection map={MAP} styleId='starry' onDesignChange={() => {}} />);
    expect(screen.getByLabelText('A colour and a badge').checked).toBe(true);
    const colour = screen.getByLabelText('Visited country colour');
    expect(colour.value).toBe('#7c3aed');
    // Choosing a colour leaves a metallic finish
    fireEvent.input(colour, { target: { value: '#aa00aa' } });
    expect(coloured.change).toHaveBeenLastCalledWith({ visited: '#aa00aa', visitedFinish: null });
    fireEvent.click(screen.getByLabelText('Visited country colour: back to the usual colour'));
    expect(coloured.change).toHaveBeenLastCalledWith({ visited: null, visitedFinish: null });
  });

  // A metallic finish beside the colour (25 Nov 2026, the user's wish: gold, silver, bronze)
  it('offers gold, silver and bronze beside the visited colour, the chosen one pressed', () => {
    const e = editor({ design: { ...DESIGN, visitedLook: 'COLOUR', visitedFinish: 'SILVER' } });
    useMapDesignEditor.mockReturnValue(e);
    open();
    expect(screen.getByText('Silver').closest('button').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByText('Gold').closest('button'));
    expect(e.change).toHaveBeenLastCalledWith({ visitedFinish: 'GOLD' });
    fireEvent.click(screen.getByText('Silver').closest('button'));
    expect(e.change).toHaveBeenLastCalledWith({ visitedFinish: null });
  });

  // 25 Nov 2026, the user's wish: the strings' colours "all in one place", the Strings panel
  it('leaves the strings’ colours to the Strings panel, and says so', () => {
    useMapDesignEditor.mockReturnValue(editor({ design: { ...DESIGN, string: '#c0ffee' } }));
    const { container } = open();
    expect(screen.queryByLabelText('String colour')).toBeNull();
    expect(container.querySelector('[data-string-colours-moved]').textContent).toBe('The strings’ colours are in the Strings panel, opened from the country list.');
  });

  it('colours a country, and puts every one back', () => {
    const e = editor();
    useMapDesignEditor.mockReturnValue(e);
    const { container } = open();
    expect(screen.getByText(/^1 of \d+ coloured your way$/)).toBeTruthy();
    fireEvent.click(screen.getByText('Choose colours'));
    fireEvent.input(container.querySelector('[data-design-place="JP"] input'), { target: { value: '#444444' } });
    expect(e.setCountryColour).toHaveBeenCalledWith('JP', '#444444');
    fireEvent.click(screen.getByText('Every country in its usual colour', { selector: 'button' }));
    expect(e.change).toHaveBeenCalledWith({ countries: {} });
  });

  it('hands the picture to the editor, and locks uploads for an unverified address', () => {
    const e = editor();
    useMapDesignEditor.mockReturnValue(e);
    useMustVerifyEmail.mockReturnValue(true);
    const { container } = open();
    expect(screen.getByText('Choose a picture').disabled).toBe(true);
    const file = new File(['x'], 'sea.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('[data-design-picture-input]'), { target: { files: [file] } });
    expect(e.choosePicture).toHaveBeenCalledWith(file);
  });

  it('says when it is saving, has saved, or failed', () => {
    useMapDesignEditor.mockReturnValue(editor({ status: { state: 'saving', error: '' } }));
    const { unmount } = open();
    expect(screen.getByText('Saving…')).toBeTruthy();
    unmount();
    useMapDesignEditor.mockReturnValue(editor({ status: { state: 'saved', error: '' } }));
    const second = open();
    expect(screen.getByText('Saved.')).toBeTruthy();
    second.unmount();
    useMapDesignEditor.mockReturnValue(editor({ status: { state: 'idle', error: 'The design could not be saved.' } }));
    open();
    expect(screen.getByRole('alert').textContent).toBe('The design could not be saved.');
  });
});
