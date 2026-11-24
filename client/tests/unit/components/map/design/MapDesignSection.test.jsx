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

  it('changes the strings’ colour, and puts it back (docs/API.md "Strings")', () => {
    const e = editor({ design: { ...DESIGN, string: '#c0ffee' } });
    useMapDesignEditor.mockReturnValue(e);
    open();
    expect(screen.getByLabelText('String colour').value).toBe('#c0ffee');
    fireEvent.input(screen.getByLabelText('String colour'), { target: { value: '#1d4ed8' } });
    fireEvent.click(screen.getByLabelText('String colour: back to the usual colour'));
    expect(e.change.mock.calls).toEqual([[{ string: '#1d4ed8' }], [{ string: null }]]);
  });

  // Two colours twisted together, as baker's twine (25 Nov 2026, the user's wish)
  it('twists a second colour into the strings, from the style’s usual one, and back to one colour', () => {
    const e = editor({ design: { ...DESIGN, string: '#c8102e', stringTwist: null } });
    useMapDesignEditor.mockReturnValue(e);
    const { rerender } = open();
    const box = screen.getByLabelText('Two colours twisted together');
    expect(box.checked).toBe(false);
    expect(screen.queryByLabelText('Second string colour')).toBeNull();
    fireEvent.click(box);
    // The style's usual second colour, as its tokens give it
    expect(e.change).toHaveBeenLastCalledWith({ stringTwist: expect.stringMatching(/^#[0-9a-f]{6}$/) });

    const twined = editor({ design: { ...DESIGN, string: '#c8102e', stringTwist: '#123456' } });
    useMapDesignEditor.mockReturnValue(twined);
    rerender(<MapDesignSection map={MAP} styleId='starry' onDesignChange={() => {}} />);
    expect(screen.getByLabelText('Two colours twisted together').checked).toBe(true);
    const second = screen.getByLabelText('Second string colour');
    expect(second.value).toBe('#123456');
    fireEvent.input(second, { target: { value: '#00aa00' } });
    expect(twined.change).toHaveBeenLastCalledWith({ stringTwist: '#00aa00' });
    // "Usual" is the style's usual second colour, never one colour again
    fireEvent.click(screen.getByLabelText('Second string colour: back to the usual colour'));
    expect(twined.change).toHaveBeenLastCalledWith({ stringTwist: expect.stringMatching(/^#[0-9a-f]{6}$/) });
    fireEvent.click(screen.getByLabelText('Two colours twisted together'));
    expect(twined.change).toHaveBeenLastCalledWith({ stringTwist: null });
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
