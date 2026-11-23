import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useMapDesignEditor from '@/hooks/useMapDesignEditor';
import { removeDesignPicture, updateMapDesign } from '@/api/travelApi';
import { uploadDesignPicture } from '@/utils/map/uploadDesignPicture';

vi.mock('@/api/travelApi', () => ({ updateMapDesign: vi.fn(), removeDesignPicture: vi.fn() }));
vi.mock('@/utils/map/uploadDesignPicture', () => ({ uploadDesignPicture: vi.fn() }));

const SHOWN = { shown: true, countries: { FR: '#112233' }, names: null, grid: null, hover: null, string: null, picture: null };
const flush = () => act(async () => {});
const wait = (ms) => act(async () => vi.advanceTimersByTimeAsync(ms));

let onDesignChange;
let preview;
const open = (design = SHOWN, extra = {}) =>
  renderHook((props) => useMapDesignEditor(props), {
    initialProps: { mapId: 'm1', style: 'mono', design, onDesignChange, preview, ...extra },
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  onDesignChange = vi.fn();
  preview = { set: vi.fn() };
  updateMapDesign.mockImplementation(async (_mapId, body) => ({ design: { ...SHOWN, ...body, saved: true } }));
});

afterEach(() => vi.useRealTimers());

describe('useMapDesignEditor', () => {
  it('starts from the map’s design', () => {
    const { result } = open();
    expect(result.current.design).toBe(SHOWN);
    expect(result.current.status).toEqual({ state: 'idle', error: '' });
  });

  it('shows a colour at once through the preview, without touching the map’s state', () => {
    const { result } = open();
    act(() => result.current.change({ names: '#445566' }));
    expect(result.current.design).toEqual({ ...SHOWN, names: '#445566' });
    expect(preview.set).toHaveBeenLastCalledWith({ ...SHOWN, names: '#445566' });
    expect(onDesignChange).not.toHaveBeenCalled();
  });

  it('saves 500 ms after the last change, once, with the style and every change waiting', async () => {
    const { result } = open();
    act(() => result.current.change({ names: '#445566' }));
    await wait(300);
    act(() => result.current.change({ grid: '#778899' }));
    await wait(499);
    expect(updateMapDesign).not.toHaveBeenCalled();
    await wait(1);
    expect(updateMapDesign).toHaveBeenCalledTimes(1);
    expect(updateMapDesign).toHaveBeenCalledWith('m1', { style: 'mono', names: '#445566', grid: '#778899' });
  });

  it('hands the saved design to the map’s state and lets the preview go', async () => {
    const { result } = open();
    act(() => result.current.change({ names: '#445566' }));
    await wait(500);
    expect(onDesignChange).toHaveBeenCalledWith('mono', expect.objectContaining({ names: '#445566', saved: true }));
    expect(preview.set).toHaveBeenLastCalledWith(null);
    expect(result.current.status.state).toBe('saved');
    // Back to the map's own (the page passes the saved one in)
    expect(result.current.design).toBe(SHOWN);
  });

  it('switches the design on with the first change, through the map’s state', async () => {
    const { result } = open(null);
    act(() => result.current.change({ names: '#445566' }));
    expect(result.current.design.shown).toBe(true);
    expect(onDesignChange).toHaveBeenCalledWith('mono', expect.objectContaining({ shown: true, names: '#445566' }));
    await wait(500);
    expect(updateMapDesign).toHaveBeenCalledWith('m1', { style: 'mono', names: '#445566', shown: true });
  });

  it('switching the design off goes to the map’s state, not the preview', () => {
    const { result } = open();
    act(() => result.current.change({ shown: false }));
    expect(onDesignChange).toHaveBeenCalledWith('mono', expect.objectContaining({ shown: false }));
    expect(preview.set).toHaveBeenLastCalledWith(null);
  });

  it('sets and clears one place’s colour', async () => {
    const { result } = open();
    act(() => result.current.setCountryColour('JP', '#aabbcc'));
    expect(result.current.design.countries).toEqual({ FR: '#112233', JP: '#aabbcc' });
    act(() => result.current.setCountryColour('FR', null));
    expect(result.current.design.countries).toEqual({ JP: '#aabbcc' });
    await wait(500);
    expect(updateMapDesign).toHaveBeenCalledWith('m1', { style: 'mono', countries: { JP: '#aabbcc' } });
  });

  it('goes back to the map’s design, saying why, when the save fails', async () => {
    updateMapDesign.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many colours.' }));
    const { result } = open();
    act(() => result.current.change({ names: '#445566' }));
    await wait(500);
    expect(result.current.design).toBe(SHOWN);
    expect(result.current.status).toEqual({ state: 'idle', error: 'Too many colours.' });
    expect(onDesignChange).toHaveBeenLastCalledWith('mono', SHOWN);
  });

  it('drops an older save’s answer when a newer change is on its way', async () => {
    let first;
    updateMapDesign.mockImplementationOnce(() => new Promise((resolve) => (first = resolve)));
    const { result } = open();
    act(() => result.current.change({ names: '#445566' }));
    await wait(500);
    act(() => result.current.change({ grid: '#778899' }));
    await act(async () => first({ design: { ...SHOWN, names: '#445566' } }));
    expect(onDesignChange).not.toHaveBeenCalled();
    expect(result.current.design.grid).toBe('#778899');
    await wait(500);
    expect(onDesignChange).toHaveBeenCalledTimes(1);
  });

  it('sends what’s waiting at once when Settings closes, with the style', async () => {
    const { result, unmount } = open();
    act(() => result.current.change({ names: '#445566' }));
    unmount();
    await flush();
    expect(updateMapDesign).toHaveBeenCalledWith('m1', { style: 'mono', names: '#445566' });
    expect(onDesignChange).toHaveBeenCalledWith('mono', expect.objectContaining({ names: '#445566' }));
    expect(preview.set).toHaveBeenLastCalledWith(null);
  });

  it('uploads a sea picture for this style, after the colours waiting', async () => {
    uploadDesignPicture.mockImplementation(async (_mapId, _style, _file, onProgress) => {
      onProgress(0.5);
      return { ...SHOWN, picture: { url: 'blob:sea' } };
    });
    const { result } = open();
    act(() => result.current.change({ names: '#445566' }));
    const file = new File(['x'], 'sea.png');
    await act(async () => result.current.choosePicture(file));
    expect(updateMapDesign).toHaveBeenCalledTimes(1);
    expect(uploadDesignPicture).toHaveBeenCalledWith('m1', 'mono', file, expect.any(Function));
    expect(onDesignChange).toHaveBeenLastCalledWith('mono', expect.objectContaining({ picture: { url: 'blob:sea' } }));
    expect(result.current.picture).toEqual({ busy: false, progress: 0 });
  });

  it('removes this style’s picture', async () => {
    removeDesignPicture.mockResolvedValue({ design: { ...SHOWN, picture: null } });
    const { result } = open({ ...SHOWN, picture: { url: 'x' } });
    await act(async () => result.current.removePicture());
    expect(removeDesignPicture).toHaveBeenCalledWith('m1', 'mono');
    expect(onDesignChange).toHaveBeenLastCalledWith('mono', { ...SHOWN, picture: null });
  });

  it('says when the picture couldn’t be uploaded', async () => {
    uploadDesignPicture.mockRejectedValue(new Error(''));
    const { result } = open();
    await act(async () => result.current.choosePicture(new File(['x'], 'sea.png')));
    expect(result.current.status.error).toBe('The picture couldn’t be uploaded. Please try again.');
    expect(result.current.picture.busy).toBe(false);
  });
});
