import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import CountryLayer from '@/components/map/CountryLayer';
import { takeHoverPoint } from '@/utils/map/hoverPoint';
import { stubPointerEvents } from './helpers';

// Every place on the map: about 230 groups, so plain selectors only
const draw = (props = {}) => {
  const onSelect = vi.fn();
  const onHover = vi.fn();
  const result = render(
    <svg>
      <CountryLayer visitsByCode={{}} zoom={1} onSelect={onSelect} onHover={onHover} {...props} />
    </svg>,
  );
  const layer = result.container.querySelector('svg > g');
  const place = (code) => layer.querySelector(`[data-code="${code}"]`);
  return { ...result, layer, place, onSelect, onHover };
};

describe('CountryLayer', () => {
  beforeEach(() => stubPointerEvents());
  afterEach(() => vi.useRealTimers());

  it('draws every country, the micro-states as dots and the poles as roses', () => {
    const { layer, place } = draw();
    expect(place('FR').querySelectorAll('path').length).toBeGreaterThan(0);
    expect(place('MC').querySelector('circle')).not.toBeNull();
    expect(place('XN').querySelector('use')).not.toBeNull();
    expect(place('AQ')).not.toBeNull();
    // The UK as one place, not its nations
    expect(place('GB')).not.toBeNull();
    expect(place('XE')).toBeNull();
    expect(layer.querySelectorAll('[data-code]').length).toBeGreaterThan(220);
  });

  it('passes each place its status, planned trip and selection', () => {
    const { place } = draw({ visitsByCode: { FR: 'VISITED' }, plannedCodes: new Set(['JP', 'MC', 'XN']), selectedCode: 'PE' });
    expect(place('FR').getAttribute('data-been')).toBe('true');
    expect(place('JP').hasAttribute('data-planned')).toBe(true);
    expect(place('MC').hasAttribute('data-planned')).toBe(true);
    expect(place('XN').hasAttribute('data-planned')).toBe(true);
    expect(place('PE').getAttribute('class')).toContain('stroke-map-ink');
  });

  it('draws the UK’s four nations instead of it on a map that splits it', () => {
    const { place } = draw({ splitUk: true });
    expect(place('GB')).toBeNull();
    for (const nation of ['XE', 'XC', 'XW', 'XI']) expect(place(nation)).not.toBeNull();
  });

  it('leaves out Antarctica and the poles beside it while it is hidden', () => {
    const { place } = draw({ showAntarctica: false });
    expect(place('AQ')).toBeNull();
    expect(place('XS')).toBeNull();
    expect(place('QS')).toBeNull();
    expect(place('XN')).not.toBeNull();
  });

  it('swaps in the detailed outlines it is given', () => {
    const { place } = draw({ detail: { FR: ['M1 1L2 2'] } });
    const paths = place('FR').querySelectorAll('path');
    expect(paths.length).toBe(1);
    expect(paths[0].getAttribute('d')).toBe('M1 1L2 2');
  });

  it('fades the visited or not-visited places with the filters', () => {
    expect(draw({ showVisited: false }).layer.getAttribute('class')).toContain('[&_[data-been=true]]:opacity-15');
    expect(draw({ showUnvisited: false }).layer.getAttribute('class')).toContain('[&_[data-been=false]]:opacity-15');
  });

  it('opens the place clicked, through afterTap when there is one', () => {
    const { place, onSelect, layer } = draw();
    fireEvent.click(place('FR').querySelector('path'));
    expect(onSelect).toHaveBeenCalledWith('FR');
    fireEvent.click(layer);
    expect(onSelect).toHaveBeenCalledTimes(1);

    const afterTap = vi.fn();
    const tapped = draw({ afterTap });
    fireEvent.click(tapped.place('MC').querySelector('circle'));
    expect(afterTap).toHaveBeenCalledTimes(1);
    expect(tapped.onSelect).not.toHaveBeenCalled();
    afterTap.mock.calls[0][0]();
    expect(tapped.onSelect).toHaveBeenCalledWith('MC');
  });

  it('tells of the country under a mouse once, and of none when it leaves', () => {
    const { place, onHover, layer } = draw();
    fireEvent.pointerOver(place('FR').querySelector('path'), { pointerType: 'mouse' });
    fireEvent.pointerOver(place('FR').querySelector('path'), { pointerType: 'mouse' });
    expect(onHover).toHaveBeenCalledTimes(1);
    expect(onHover).toHaveBeenLastCalledWith('FR');
    fireEvent.pointerOver(place('ES').querySelector('path'), { pointerType: 'mouse' });
    expect(onHover).toHaveBeenLastCalledWith('ES');
    fireEvent.pointerLeave(layer);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it('never hovers on touch', () => {
    const { place, onHover } = draw();
    fireEvent.pointerOver(place('FR').querySelector('path'), { pointerType: 'touch' });
    expect(onHover).not.toHaveBeenCalled();
  });

  it('shows the postcard after a long press, at the finger, and the press opens nothing', () => {
    vi.useFakeTimers();
    const { place, onHover, onSelect } = draw();
    const path = place('FR').querySelector('path');
    fireEvent.pointerDown(path, { pointerType: 'touch', pointerId: 7, clientX: 40, clientY: 60 });
    act(() => {
      vi.advanceTimersByTime(449);
    });
    expect(onHover).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onHover).toHaveBeenCalledWith('FR');
    expect(takeHoverPoint()).toEqual({ x: 40, y: 60 });
    // Its long-press menu never shows
    expect(fireEvent.contextMenu(path)).toBe(false);
    fireEvent.click(path);
    expect(onSelect).not.toHaveBeenCalled();
    // Lifting the finger hides it
    fireEvent.pointerUp(window, { pointerId: 7 });
    expect(onHover).toHaveBeenLastCalledWith(null);
    // The next tap opens as usual
    fireEvent.click(path);
    expect(onSelect).toHaveBeenCalledWith('FR');
  });

  it('cancels the long press when the finger moves (a pan) or a second one lands (a pinch)', () => {
    vi.useFakeTimers();
    const { place, onHover } = draw();
    const path = place('FR').querySelector('path');
    fireEvent.pointerDown(path, { pointerType: 'touch', pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 20, clientY: 0 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onHover).not.toHaveBeenCalled();

    fireEvent.pointerDown(path, { pointerType: 'touch', pointerId: 2, clientX: 0, clientY: 0 });
    fireEvent.pointerDown(path, { pointerType: 'touch', pointerId: 3, clientX: 30, clientY: 0 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onHover).not.toHaveBeenCalled();
  });

  it('starts no long press for a mouse, or off the places', () => {
    vi.useFakeTimers();
    const { place, onHover, layer } = draw();
    fireEvent.pointerDown(place('FR').querySelector('path'), { pointerType: 'mouse', pointerId: 1 });
    fireEvent.pointerDown(layer, { pointerType: 'touch', pointerId: 2 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onHover).not.toHaveBeenCalled();
    // Nothing held, so the browser's own menu is left alone
    expect(fireEvent.contextMenu(layer)).toBe(true);
  });
});
