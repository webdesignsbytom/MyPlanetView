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
