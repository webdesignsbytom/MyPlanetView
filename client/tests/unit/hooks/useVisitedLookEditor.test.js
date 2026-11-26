// Changing how the map shows the places been to (src/hooks/useVisitedLookEditor.js; 25 Nov 2026,
// the user's wish: the map's own, in every map style)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useVisitedLookEditor from '@/hooks/useVisitedLookEditor';
import { DESIGN_SAVE_DELAY_MS } from '@/utils/map/mapDesign';
import { createValueStore } from '@/utils/map/valueStore';

const MAP = { id: 'map-1', visitedLook: 'BADGE', visitedColour: null, visitedFinish: null };

describe('useVisitedLookEditor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const start = (onSave = vi.fn(() => Promise.resolve())) => {
    const preview = createValueStore(null);
    const hook = renderHook(({ map }) => useVisitedLookEditor({ map, onSave, preview }), { initialProps: { map: MAP } });
    return { ...hook, preview, onSave };
  };

  it('shows each change at once, and saves the lot a moment after the last', async () => {
    const { result, preview, onSave } = start();
    expect(result.current.look).toEqual({ visitedLook: 'BADGE', visitedColour: null, visitedFinish: null });
    act(() => result.current.change({ visitedLook: 'COLOUR' }));
    act(() => result.current.change({ visitedFinish: 'GOLD' }));
    expect(result.current.look).toEqual({ visitedLook: 'COLOUR', visitedColour: null, visitedFinish: 'GOLD' });
    expect(preview.get()).toEqual({ visitedLook: 'COLOUR', visitedColour: null, visitedFinish: 'GOLD' });
    expect(onSave).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(DESIGN_SAVE_DELAY_MS));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ visitedLook: 'COLOUR', visitedFinish: 'GOLD' });
  });

  it('lets the preview go once the map has caught up with it, so the old look never flashes back', async () => {
    const { result, preview, rerender } = start();
    act(() => result.current.change({ visitedLook: 'BOTH', visitedColour: '#7c3aed' }));
    await act(async () => vi.advanceTimersByTime(DESIGN_SAVE_DELAY_MS));
    // Saved, but the map's state hasn't caught up yet: still shown from the preview
    expect(preview.get()).toMatchObject({ visitedLook: 'BOTH' });
    rerender({ map: { ...MAP, visitedLook: 'BOTH', visitedColour: '#7c3aed' } });
    expect(preview.get()).toBeNull();
    expect(result.current.look).toEqual({ visitedLook: 'BOTH', visitedColour: '#7c3aed', visitedFinish: null });
  });

  it('says so when it couldn’t be saved, and shows the map’s own again', async () => {
    const onSave = vi.fn(() => Promise.reject(Object.assign(new Error('x'), { friendlyMessage: 'No connection.' })));
    const { result, preview } = start(onSave);
    act(() => result.current.change({ visitedLook: 'COLOUR' }));
    await act(async () => vi.advanceTimersByTime(DESIGN_SAVE_DELAY_MS));
    expect(result.current.error).toBe('No connection.');
    expect(preview.get()).toBeNull();
    expect(result.current.look.visitedLook).toBe('BADGE');
  });

  it('sends what’s waiting when Settings closes', () => {
    const { result, unmount, onSave, preview } = start();
    act(() => result.current.change({ visitedColour: '#aa00aa' }));
    unmount();
    expect(onSave).toHaveBeenCalledWith({ visitedColour: '#aa00aa' });
    expect(preview.get()).toBeNull();
  });
});
